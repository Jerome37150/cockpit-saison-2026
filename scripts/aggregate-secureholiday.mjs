#!/usr/bin/env node
/**
 * aggregate-secureholiday.mjs
 * ----------------------------------------------------------------------------
 * Lit tous les XLSX présents dans data/raw/secureholiday/{pack-trafic,
 * pack-trafic-apporteurs, stats-clicks}/ et produit
 * src/data/sources/secureholiday.json — agrégé par mois × type de réservation,
 * par marché, par établissement, et par engine pour les stats clicks.
 *
 * Dédup par BookingId (les XLSX se recouvrent entre bootstrap année / range
 * YTD / daily J-1 — un BookingId vu plusieurs fois prend la dernière version).
 *
 * Usage : node scripts/aggregate-secureholiday.mjs
 *         (appelé automatiquement à la fin de sync-secureholiday.mjs)
 * ============================================================================
 */

import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = join(ROOT, 'data', 'raw', 'secureholiday');
const OUT = join(ROOT, 'src', 'data', 'sources', 'secureholiday.json');

// ----- helpers ---------------------------------------------------------------

// Convertit un Excel serial date (ex: 46161.6023) en ISO YYYY-MM-DD.
// Excel "epoch" est le 1899-12-30 (à cause du bug "1900 leap year" qu'Excel
// reproduit pour rester compatible avec Lotus 1-2-3).
function excelDateToISO(serial) {
  if (typeof serial !== 'number' || !Number.isFinite(serial)) return null;
  const ms = (serial - 25569) * 86400 * 1000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function isoToMonth(iso) {
  return iso ? iso.slice(0, 7) + '-01' : null;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function listXlsx(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.xlsx'))
    .map((f) => join(dir, f));
}

// ----- lecture des DetailSales avec dédup par BookingId ----------------------

function readAllDetailSales(dirName) {
  const dir = join(RAW, dirName);
  const files = listXlsx(dir);
  const byId = new Map();
  for (const filePath of files) {
    const wb = XLSX.read(readFileSync(filePath));
    const sheet = wb.Sheets['DetailSales'];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
    for (const row of rows) {
      if (row.BookingId) byId.set(row.BookingId, row);
    }
  }
  return Array.from(byId.values());
}

console.log('[sh-agg] Lecture des DetailSales…');
const directe = readAllDetailSales('pack-trafic');
const apporteur = readAllDetailSales('pack-trafic-apporteurs');
console.log(`[sh-agg]   Directe   (Pack Trafic)          : ${directe.length} bookings uniques`);
console.log(`[sh-agg]   Apporteur (Pack Trafic Apporteurs) : ${apporteur.length} bookings uniques`);

// ----- agrégation par mois × type de réservation -----------------------------

function aggregateByMonth(bookings, typeReservation) {
  const byMonth = new Map();
  for (const b of bookings) {
    const iso = excelDateToISO(b.SaleDate);
    const mois = isoToMonth(iso);
    if (!mois) continue;
    if (!byMonth.has(mois)) {
      byMonth.set(mois, { mois, typeReservation, ca: 0, volumeResa: 0 });
    }
    const e = byMonth.get(mois);
    e.ca += num(b.TotalPriceAllincluded ?? b.TotalPrice);
    e.volumeResa += 1;
  }
  return Array.from(byMonth.values())
    .map((e) => ({
      ...e,
      annee: Number(e.mois.slice(0, 4)),
      ca: Math.round(e.ca),
      ticketMoyen: e.volumeResa > 0 ? Math.round(e.ca / e.volumeResa) : 0,
    }))
    .sort((a, b) => a.mois.localeCompare(b.mois));
}

const perMonth = [
  ...aggregateByMonth(directe, 'Directe'),
  ...aggregateByMonth(apporteur, 'Apporteur'),
];
console.log(`[sh-agg] perMonth : ${perMonth.length} entrées (mois × type)`);

// ----- agrégation par mois × marché (pays du client) -------------------------

function aggregateByMonthMarket(bookings) {
  const byKey = new Map();
  for (const b of bookings) {
    const iso = excelDateToISO(b.SaleDate);
    const mois = isoToMonth(iso);
    if (!mois) continue;
    const country = (b.ClientCountry || '').trim().toUpperCase() || 'XX';
    const key = `${mois}|${country}`;
    if (!byKey.has(key)) {
      byKey.set(key, { mois, country, ca: 0, volumeResa: 0 });
    }
    const e = byKey.get(key);
    e.ca += num(b.TotalPriceAllincluded ?? b.TotalPrice);
    e.volumeResa += 1;
  }
  return Array.from(byKey.values())
    .map((e) => ({ ...e, ca: Math.round(e.ca) }))
    .sort((a, b) => a.mois.localeCompare(b.mois) || a.country.localeCompare(b.country));
}

const perMonthByMarket = aggregateByMonthMarket([...directe, ...apporteur]);
console.log(`[sh-agg] perMonthByMarket : ${perMonthByMarket.length} entrées`);

// ----- agrégation par établissement (cumul sur toute la période) -------------

function aggregateByEstablishment(bookings) {
  const byId = new Map();
  for (const b of bookings) {
    const id = b.EstablishmentId;
    if (!id) continue;
    if (!byId.has(id)) {
      byId.set(id, {
        establishmentId: id,
        establishmentName: b.EstablishmentName || '',
        country: b.GeoZ1 || '',
        region: b.GeoZ2 || '',
        department: b.GeoZ3 || '',
        ca: 0,
        volumeResa: 0,
      });
    }
    const e = byId.get(id);
    e.ca += num(b.TotalPriceAllincluded ?? b.TotalPrice);
    e.volumeResa += 1;
  }
  return Array.from(byId.values())
    .map((e) => ({ ...e, ca: Math.round(e.ca) }))
    .sort((a, b) => b.ca - a.ca);
}

const perEstablishment = aggregateByEstablishment([...directe, ...apporteur]);
console.log(`[sh-agg] perEstablishment : ${perEstablishment.length} campings distincts`);

// ----- stats clicks : snapshot du fichier le plus représentatif --------------
// Note : les XLSX Stats Clicks sont déjà agrégés sur la plage de dates choisie.
// On expose le snapshot du fichier qui couvre le plus large range disponible
// (typiquement le bootstrap année complète), avec mention de la période couverte.

function pickWidestStatsClicks() {
  const dir = join(RAW, 'stats-clicks');
  const files = listXlsx(dir);
  if (files.length === 0) return null;
  // On prend le fichier le plus gros = celui qui couvre le plus large range
  const sorted = files.map((f) => ({ f, size: statSync(f).size })).sort((a, b) => b.size - a.size);
  return sorted[0].f;
}

function readEngineSnapshot(filePath) {
  if (!filePath) return { coversFile: null, perEngine: [] };
  const wb = XLSX.read(readFileSync(filePath));
  const sheet = wb.Sheets['Global'];
  if (!sheet) return { coversFile: null, perEngine: [] };

  // Le sheet Global a 2 rangées d'en-tête (groupes "Nb Clickout" / "Nb Clickout
  // dédoublés"). On lit en mode header:1 et on accède par index pour éviter
  // les collisions de noms (Total/FR/EN/... apparaissent 2 fois).
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  // Row 0 = group headers, Row 1 = column names, Row 2+ = data
  const result = [];
  for (let r = 2; r < data.length; r++) {
    const row = data[r];
    if (!row || !row[0]) continue;
    result.push({
      engineId: num(row[0]),
      engineName: String(row[1] ?? ''),
      shCount: num(row[2]),
      shCountEuro: num(row[3]),
      // Index 4 = Nb Clickout Total, 5..18 = par langue
      clickouts: num(row[4]),
      // Index 19 = Nb Clickout dédoublés Total
      clickoutsDedup: num(row[19]),
      // Index 35..38 = stats clicks + Budget
      clicksMin: num(row[34]),
      clicksMoyen: num(row[35]),
      clicksMedian: num(row[36]),
      clicksMax: num(row[37]),
      budget: num(row[38]),
    });
  }
  return { coversFile: filePath.split(/[\\/]/).pop(), perEngine: result };
}

const statsClicks = readEngineSnapshot(pickWidestStatsClicks());
console.log(
  `[sh-agg] statsClicks : ${statsClicks.perEngine.length} engines (snapshot ${statsClicks.coversFile})`,
);

// ----- écriture du JSON ------------------------------------------------------

const out = {
  syncedAt: new Date().toISOString(),
  _about:
    'Secure Holiday — agrégat généré par scripts/aggregate-secureholiday.mjs depuis les XLSX bruts dans data/raw/secureholiday/. ' +
    'perMonth = volume/CA par mois × type de réservation (Directe = Pack Trafic, Apporteur = Pack Trafic Apporteurs). ' +
    'statsClicks = snapshot du fichier Stats Clicks le plus large (clickouts + budget par engine).',
  perMonth,
  perMonthByMarket,
  perEstablishment,
  statsClicks,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
console.log(`[sh-agg] → ${OUT} (${(JSON.stringify(out).length / 1024).toFixed(1)} Ko)`);
