#!/usr/bin/env node
/**
 * sync-piano.mjs
 * ----------------------------------------------------------------------------
 * Synchronise les données Piano Analytics vers src/data/sources/piano.json.
 *
 * Pré-requis (.env) :
 *   PIANO_API_KEY=<access key>
 *   PIANO_API_SECRET=<secret>
 *   PIANO_SITES=CD:<numSite>,C2B:<numSite>,...
 *
 * Usage : npm run sync-piano
 *
 * Schéma cible : src/data/shared/schemas.js → pianoSchema
 * Doc          : docs/sources-piano.md
 *
 * Mapping Piano découvert par scripts/piano-probe.mjs (cf. memory/) :
 *   - Dimension canal : `src` (et non src_channel comme initialement prévu)
 *   - Event clickout  : event_name = "click_out.cta_camping" (filter)
 *   - Mois            : `date_month` retourne "January"/"February"/... en EN
 *   - Site            : `site` retourne le label (ex. "Camping DIrect")
 *   - Pays            : `geo_country` retourne en EN ("France", "Germany"…)
 * ============================================================================
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv();

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = resolve(ROOT, 'src/data/sources/piano.json');

const { PIANO_API_KEY, PIANO_API_SECRET, PIANO_SITES } = process.env;
if (!PIANO_API_KEY || !PIANO_API_SECRET) {
  console.error('[sync-piano] ERREUR : PIANO_API_KEY ou PIANO_API_SECRET absent du .env');
  process.exit(1);
}

const SITES = Object.fromEntries(
  (PIANO_SITES || '').split(',').filter(Boolean).map((p) => p.split(':')),
);
const ALL_SITE_IDS = Object.values(SITES).map(Number);
if (ALL_SITE_IDS.length === 0) {
  console.error('[sync-piano] ERREUR : PIANO_SITES vide.');
  process.exit(1);
}

// -----------------------------------------------------------------------------
// Constantes : période + mappings Piano → cockpit
// -----------------------------------------------------------------------------

const SEASON_YEAR = 2026;
const PERIOD_START = `${SEASON_YEAR}-01-01`;
const PERIOD_END   = `${SEASON_YEAR}-04-30`;
const PERIOD = { p1: [{ type: 'D', start: PERIOD_START, end: PERIOD_END }] };

const CLICKOUT_EVENT = 'click_out.cta_camping';

// Piano site label (renvoyé par dimension `site`) → code portail cockpit.
// Tient à jour avec la table Sites Piano (cf. memory/project_piano_sites.md).
const SITE_LABEL_TO_CODE = {
  'Camping DIrect':       'CD',
  'Camping2Be':           'C2B',
  'Camping Street View':  'CSV',
  'Ibericamp':            'IB',
  'Al Campeggio':         'AC',
  'Ucamping':             'UC',
  'MyCamping':            'MC',
};

// Piano src (acquisition channel) → libellé canal cockpit (cf. CANAL_KEY).
// Les valeurs non listées (N/A, Pinterest-Ads, Zeltkinder, Webmails…)
// représentent < 0.5% et sont ignorées.
const SRC_TO_CANAL = {
  'Search engines':  'SEO',
  'Paid':            'SEA',
  'Direct traffic':  'Direct',
  'Referrer sites':  'Referral',
  'Email marketing': 'CRM',
  'Social media':    'Social Media',
  'Generative AI':   'IA Générative',
};

// Mois EN → numéro pour reconstruire l'ISO YYYY-MM-01.
const MONTH_NAME_TO_NUM = {
  January:  '01', February: '02', March:    '03', April:    '04',
  May:      '05', June:     '06', July:     '07', August:   '08',
  September:'09', October:  '10', November: '11', December: '12',
};

const monthToIso = (monthName) => {
  const num = MONTH_NAME_TO_NUM[monthName];
  return num ? `${SEASON_YEAR}-${num}-01` : null;
};

// Pays EN → FR (alimenté à la demande, le cockpit utilise les libellés FR).
const COUNTRY_EN_TO_FR = {
  France: 'France',
  Germany: 'Allemagne',
  Spain: 'Espagne',
  Italy: 'Italie',
  Netherlands: 'Pays-Bas',
  Belgium: 'Belgique',
  'United Kingdom': 'Royaume-Uni',
  Switzerland: 'Suisse',
  Austria: 'Autriche',
  Portugal: 'Portugal',
  Luxembourg: 'Luxembourg',
  Poland: 'Pologne',
};

// -----------------------------------------------------------------------------
// HTTP helper
// -----------------------------------------------------------------------------

const PIANO_URL = 'https://api.atinternet.io/v3/data/getData';
const auth = Buffer.from(`${PIANO_API_KEY}:${PIANO_API_SECRET}`).toString('base64');

async function pianoQuery(body) {
  const res = await fetch(PIANO_URL, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    let detail = text;
    try { detail = JSON.parse(text).ErrorMessage || text; } catch {}
    throw new Error(`Piano HTTP ${res.status} : ${detail}`);
  }
  return JSON.parse(text)?.DataFeed?.Rows ?? [];
}

const baseQuery = (extra) => ({
  space: { s: ALL_SITE_IDS },
  period: PERIOD,
  'max-results': 5000,
  'page-num': 1,
  ...extra,
});

// -----------------------------------------------------------------------------
// Fetchers
// -----------------------------------------------------------------------------

/**
 * perPortail : trafic + clickouts par portail × mois.
 * 2 queries (visites + events filtrés sur clickout), mergées par clé site|mois.
 */
async function fetchPerPortail() {
  const [visits, clickouts] = await Promise.all([
    pianoQuery(baseQuery({
      columns: ['site', 'date_month', 'm_visits'],
      sort: ['site', 'date_month'],
    })),
    pianoQuery(baseQuery({
      columns: ['site', 'date_month', 'm_events'],
      sort: ['site', 'date_month'],
      filter: { property: { event_name: { $eq: CLICKOUT_EVENT } } },
    })),
  ]);

  const map = new Map();
  const key = (label, month) => `${label}||${month}`;

  for (const r of visits) {
    map.set(key(r.site, r.date_month), { trafic: r.m_visits, clickouts: 0 });
  }
  for (const r of clickouts) {
    const k = key(r.site, r.date_month);
    const entry = map.get(k) ?? { trafic: 0, clickouts: 0 };
    entry.clickouts = r.m_events;
    map.set(k, entry);
  }

  const rows = [];
  for (const [k, data] of map) {
    const [label, monthName] = k.split('||');
    const portail = SITE_LABEL_TO_CODE[label];
    const mois = monthToIso(monthName);
    if (!portail || !mois) continue;
    rows.push({
      annee: SEASON_YEAR,
      mois,
      portail,
      type: 'Réel',
      trafic: data.trafic,
      clickouts: data.clickouts,
      origine: 'Réel',
    });
  }
  return rows.sort((a, b) => a.portail.localeCompare(b.portail) || a.mois.localeCompare(b.mois));
}

/**
 * byChannel : trafic par canal × mois (tous portails agrégés).
 */
async function fetchByChannel() {
  const rows = await pianoQuery(baseQuery({
    columns: ['src', 'date_month', 'm_visits'],
    sort: ['date_month', '-m_visits'],
  }));

  // Agrège par (canal, mois) — Piano renvoie déjà la somme cross-sites grâce
  // au space.s multi-IDs, mais on doit bucketer les `src` en canaux cockpit.
  const agg = new Map();
  for (const r of rows) {
    const canal = SRC_TO_CANAL[r.src];
    const mois = monthToIso(r.date_month);
    if (!canal || !mois) continue;
    const k = `${canal}||${mois}`;
    agg.set(k, (agg.get(k) ?? 0) + r.m_visits);
  }

  return Array.from(agg, ([k, trafic]) => {
    const [canal, mois] = k.split('||');
    return { annee: SEASON_YEAR, mois, canal, typePeriode: 'Réel', trafic };
  }).sort((a, b) => a.mois.localeCompare(b.mois) || a.canal.localeCompare(b.canal));
}

/**
 * SEO : trafic + clickouts SEO (src = "Search engines"), mensuel + par portail.
 */
async function fetchSeo() {
  const seoFilter = { property: { src: { $eq: 'Search engines' } } };

  const [visitsBySite, clickoutsBySite, visitsMonth, clickoutsMonth] = await Promise.all([
    pianoQuery(baseQuery({
      columns: ['site', 'date_month', 'm_visits'],
      sort: ['site', 'date_month'],
      filter: seoFilter,
    })),
    pianoQuery(baseQuery({
      columns: ['site', 'date_month', 'm_events'],
      sort: ['site', 'date_month'],
      filter: { property: { $and: [
        { src: { $eq: 'Search engines' } },
        { event_name: { $eq: CLICKOUT_EVENT } },
      ] } },
    })),
    pianoQuery(baseQuery({
      columns: ['date_month', 'm_visits'],
      sort: ['date_month'],
      filter: seoFilter,
    })),
    pianoQuery(baseQuery({
      columns: ['date_month', 'm_events'],
      sort: ['date_month'],
      filter: { property: { $and: [
        { src: { $eq: 'Search engines' } },
        { event_name: { $eq: CLICKOUT_EVENT } },
      ] } },
    })),
  ]);

  // monthly (cross-portails)
  const monthlyMap = new Map();
  for (const r of visitsMonth) monthlyMap.set(r.date_month, { trafic: r.m_visits, clickouts: 0 });
  for (const r of clickoutsMonth) {
    const entry = monthlyMap.get(r.date_month) ?? { trafic: 0, clickouts: 0 };
    entry.clickouts = r.m_events;
    monthlyMap.set(r.date_month, entry);
  }

  const monthly = Array.from(monthlyMap, ([m, d]) => ({
    annee: SEASON_YEAR,
    mois: monthToIso(m),
    typePeriode: 'Réel',
    origine: 'Réel',
    trafic: d.trafic,
    clickouts: d.clickouts,
  })).filter((r) => r.mois);

  // par portail
  const perMap = new Map();
  const k = (label, month) => `${label}||${month}`;
  for (const r of visitsBySite) perMap.set(k(r.site, r.date_month), { trafic: r.m_visits, clickouts: 0 });
  for (const r of clickoutsBySite) {
    const key = k(r.site, r.date_month);
    const entry = perMap.get(key) ?? { trafic: 0, clickouts: 0 };
    entry.clickouts = r.m_events;
    perMap.set(key, entry);
  }
  const perPortail = [];
  for (const [key, d] of perMap) {
    const [label, monthName] = key.split('||');
    const portail = SITE_LABEL_TO_CODE[label];
    const mois = monthToIso(monthName);
    if (!portail || !mois) continue;
    perPortail.push({
      annee: SEASON_YEAR,
      mois,
      portail,
      typePeriode: 'Réel',
      origine: 'Réel',
      trafic: d.trafic,
      clickouts: d.clickouts,
    });
  }

  return {
    monthly: monthly.sort((a, b) => a.mois.localeCompare(b.mois)),
    perPortail: perPortail.sort((a, b) => a.portail.localeCompare(b.portail) || a.mois.localeCompare(b.mois)),
  };
}

/**
 * seaByCountry : clickouts SEA par pays × mois.
 * SEA = src "Paid", clickout = event_name "click_out.cta_camping".
 */
async function fetchSeaByCountry() {
  const rows = await pianoQuery(baseQuery({
    columns: ['geo_country', 'date_month', 'm_events'],
    sort: ['date_month', '-m_events'],
    filter: { property: { $and: [
      { src: { $eq: 'Paid' } },
      { event_name: { $eq: CLICKOUT_EVENT } },
    ] } },
  }));

  return rows
    .map((r) => ({
      annee: SEASON_YEAR,
      mois: monthToIso(r.date_month),
      pays: COUNTRY_EN_TO_FR[r.geo_country] ?? r.geo_country,
      typePeriode: 'Réel',
      clickouts: r.m_events,
    }))
    .filter((r) => r.mois)
    .sort((a, b) => a.mois.localeCompare(b.mois) || b.clickouts - a.clickouts);
}

// -----------------------------------------------------------------------------
// Run
// -----------------------------------------------------------------------------

async function main() {
  console.log(`[sync-piano] Démarrage — ${ALL_SITE_IDS.length} sites, période ${PERIOD_START} → ${PERIOD_END}.`);

  const [perPortail, byChannel, seo, seaByCountry] = await Promise.all([
    fetchPerPortail(),
    fetchByChannel(),
    fetchSeo(),
    fetchSeaByCountry(),
  ]);

  const output = {
    syncedAt: new Date().toISOString(),
    _about: 'Piano Analytics — généré par scripts/sync-piano.mjs',
    perPortail,
    byChannel,
    seoMonthly: seo.monthly,
    seoPerPortail: seo.perPortail,
    seaByCountry,
  };

  await writeFile(OUTPUT, JSON.stringify(output, null, 2) + '\n');
  console.log(`[sync-piano] OK → ${OUTPUT}`);
  console.log(`             perPortail:    ${perPortail.length} lignes`);
  console.log(`             byChannel:     ${byChannel.length} lignes`);
  console.log(`             seoMonthly:    ${seo.monthly.length} lignes`);
  console.log(`             seoPerPortail: ${seo.perPortail.length} lignes`);
  console.log(`             seaByCountry:  ${seaByCountry.length} lignes`);
}

main().catch((err) => {
  console.error('[sync-piano] ERREUR :', err.message);
  process.exit(1);
});
