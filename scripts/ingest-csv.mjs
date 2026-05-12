#!/usr/bin/env node
/**
 * ingest-csv.mjs
 * ----------------------------------------------------------------------------
 * Lit les CSV déposés par l'agent IA dans `raw-csv/inaxel/` et écrit les
 * fichiers JSON cibles dans `src/data/sources/inaxel/`.
 *
 * Comportement : pour chaque CSV présent, écrase la section correspondante
 * du JSON cible. Pour chaque CSV absent, conserve la section existante (ingest
 * incrémental — on peut mettre à jour une section sans toucher aux autres).
 *
 * Usage : npm run ingest-csv
 *
 * Convention de colonnes : voir docs/sources-csv-inaxel.md
 * Schémas cibles          : src/data/shared/schemas.js
 * ============================================================================
 */

import { readFile, writeFile, access, constants } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = resolve(ROOT, 'raw-csv/inaxel');
const OUT = resolve(ROOT, 'src/data/sources/inaxel');

// -----------------------------------------------------------------------------
// CSV parser minimal — gère guillemets et virgules dans les champs.
// Pour des CSV plus complexes (lignes multilignes, etc.), passer à papaparse.
// -----------------------------------------------------------------------------

function parseRow(line) {
  const out = [];
  let inQuotes = false;
  let cur = '';
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/^﻿/, '').trim().split('\n');
  if (lines.length === 0) return [];
  const headers = parseRow(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = parseRow(line);
    return Object.fromEntries(
      headers.map((h, i) => [h, (cells[i] ?? '').trim()]),
    );
  });
}

const exists = (p) => access(p, constants.F_OK).then(() => true, () => false);

async function readCsv(name) {
  const p = resolve(RAW, name);
  if (!(await exists(p))) return null;
  return parseCsv(await readFile(p, 'utf-8'));
}

async function readJson(p) {
  return JSON.parse(await readFile(p, 'utf-8'));
}

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
const int = (v) => (v === null || v === undefined || v === '' ? null : parseInt(v, 10));

// -----------------------------------------------------------------------------
// Ingest par domaine
// -----------------------------------------------------------------------------

async function ingestReservations() {
  const rows = await readCsv('reservations.csv');
  if (!rows) return null;
  // Colonnes : annee,mois,typePeriode,typeReservation,ca,volumeResa
  return {
    syncedAt: new Date().toISOString(),
    _about: 'Réservations & CA — ingéré depuis raw-csv/inaxel/reservations.csv',
    rows: rows.map((r) => ({
      annee: int(r.annee),
      mois: r.mois,
      typePeriode: r.typePeriode,
      typeReservation: r.typeReservation,
      ca: num(r.ca),
      volumeResa: num(r.volumeResa),
    })),
  };
}

async function ingestSea() {
  const budget = await readCsv('sea-budget.csv');
  const camp = await readCsv('sea-campagnes.csv');
  if (!budget && !camp) return null;
  const existing = await readJson(resolve(OUT, 'sea.json'));
  return {
    syncedAt: new Date().toISOString(),
    _about: 'SEA Google Ads — ingéré depuis raw-csv/inaxel/sea-*.csv',
    // sea-budget.csv : annee,mois,pays,typePeriode,budget
    budgetByCountry: budget
      ? budget.map((r) => ({
          annee: int(r.annee),
          mois: r.mois,
          pays: r.pays,
          typePeriode: r.typePeriode,
          budget: num(r.budget),
        }))
      : existing.budgetByCountry,
    // sea-campagnes.csv : id,nom,pays,type,statut,budgetMensuel,depense,impressions,clics,conversions
    campagnes: camp
      ? camp.map((r) => ({
          id: r.id,
          nom: r.nom,
          pays: r.pays,
          type: r.type,
          statut: r.statut,
          budgetMensuel: Number(r.budgetMensuel),
          depense: Number(r.depense),
          impressions: Number(r.impressions),
          clics: Number(r.clics),
          conversions: Number(r.conversions),
        }))
      : existing.campagnes,
  };
}

async function ingestCrm() {
  const base = await readCsv('crm-base.csv');
  const nl = await readCsv('crm-newsletter.csv');
  const langue = await readCsv('crm-langue.csv');
  const camp = await readCsv('crm-campagnes.csv');
  if (!base && !nl && !langue && !camp) return null;
  const existing = await readJson(resolve(OUT, 'crm.json'));
  return {
    syncedAt: new Date().toISOString(),
    _about: 'CRM emailing — ingéré depuis raw-csv/inaxel/crm-*.csv',
    // crm-base.csv : annee,mois,totalContacts,positionnes,nouveaux,desabos,netGrowth,txDesab
    base: base
      ? base.map((r) => ({
          annee: int(r.annee),
          mois: r.mois,
          totalContacts: num(r.totalContacts),
          positionnes: num(r.positionnes),
          nouveaux: num(r.nouveaux),
          desabos: num(r.desabos),
          netGrowth: num(r.netGrowth),
          txDesab: num(r.txDesab),
        }))
      : existing.base,
    // crm-newsletter.csv : annee,mois,txDelivrabilite,txOuverture,txClic,txDesab,nouveaux
    newsletter: nl
      ? nl.map((r) => ({
          annee: int(r.annee),
          mois: r.mois,
          txDelivrabilite: num(r.txDelivrabilite),
          txOuverture: num(r.txOuverture),
          txClic: num(r.txClic),
          txDesab: num(r.txDesab),
          nouveaux: num(r.nouveaux),
        }))
      : existing.newsletter,
    // crm-langue.csv : snapshotDate,langue,positionnes,txOuverture,txClic,txDesab
    langue: langue
      ? langue.map((r) => ({
          snapshotDate: r.snapshotDate,
          langue: r.langue,
          positionnes: num(r.positionnes),
          txOuverture: num(r.txOuverture),
          txClic: num(r.txClic),
          txDesab: num(r.txDesab),
        }))
      : existing.langue,
    // crm-campagnes.csv : id,nom,type,date,audience,objectif,color,resultats(JSON optionnel)
    campagnes: camp
      ? camp.map((r) => ({
          id: r.id,
          nom: r.nom,
          type: r.type,
          date: r.date,
          audience: r.audience,
          objectif: r.objectif,
          color: r.color,
          ...(r.resultats ? { resultats: JSON.parse(r.resultats) } : {}),
        }))
      : existing.campagnes,
  };
}

async function ingestBudget() {
  const leviers = await readCsv('budget-leviers.csv');
  const ca = await readCsv('budget-ca-produits.csv');
  const portef = await readCsv('budget-portefeuille.csv');
  if (!leviers && !ca && !portef) return null;
  const existing = await readJson(resolve(OUT, 'budget.json'));
  return {
    syncedAt: new Date().toISOString(),
    _about: 'Budget & finances — ingéré depuis raw-csv/inaxel/budget-*.csv',
    // budget-leviers.csv : annee,levier,typePeriode,periode,montant
    leviers: leviers
      ? leviers.map((r) => ({
          annee: int(r.annee),
          levier: r.levier,
          typePeriode: r.typePeriode,
          periode: r.periode,
          montant: num(r.montant),
        }))
      : existing.leviers,
    // budget-ca-produits.csv : annee,produit,typePeriode,periode,montant
    caProduits: ca
      ? ca.map((r) => ({
          annee: int(r.annee),
          produit: r.produit,
          typePeriode: r.typePeriode,
          periode: r.periode,
          montant: num(r.montant),
        }))
      : existing.caProduits,
    // budget-portefeuille.csv : annee,metrique,typePeriode,periode,volume
    portefeuilleCampings: portef
      ? portef.map((r) => ({
          annee: int(r.annee),
          metrique: r.metrique,
          typePeriode: r.typePeriode,
          periode: r.periode,
          volume: num(r.volume),
        }))
      : existing.portefeuilleCampings,
  };
}

async function ingestClients() {
  const rows = await readCsv('clients.csv');
  if (!rows) return null;
  // Colonnes : id,nom,pays,portail,type,statut,trafic,clickouts,txConv,resa,
  //            budgetMensuel,budgetRestant,pctConsomme
  return {
    syncedAt: new Date().toISOString(),
    _about: 'Liste clients — ingéré depuis raw-csv/inaxel/clients.csv',
    rows: rows.map((r) => ({
      id: r.id,
      nom: r.nom,
      pays: r.pays,
      portail: r.portail,
      type: r.type,
      statut: r.statut,
      trafic: Number(r.trafic),
      clickouts: Number(r.clickouts),
      txConv: Number(r.txConv),
      resa: Number(r.resa),
      budgetMensuel: num(r.budgetMensuel),
      budgetRestant: num(r.budgetRestant),
      pctConsomme: num(r.pctConsomme),
    })),
  };
}

// -----------------------------------------------------------------------------
// Run
// -----------------------------------------------------------------------------

async function main() {
  const updates = {
    'reservations.json': await ingestReservations(),
    'sea.json': await ingestSea(),
    'crm.json': await ingestCrm(),
    'budget.json': await ingestBudget(),
    'clients.json': await ingestClients(),
  };

  let touched = 0;
  for (const [name, data] of Object.entries(updates)) {
    if (data) {
      await writeFile(resolve(OUT, name), JSON.stringify(data, null, 2) + '\n');
      console.log(`[ingest-csv] OK → inaxel/${name}`);
      touched++;
    } else {
      console.log(`[ingest-csv] skip inaxel/${name} (aucun CSV correspondant)`);
    }
  }

  if (touched === 0) {
    console.log('[ingest-csv] Rien à ingérer — déposez les CSV dans raw-csv/inaxel/.');
  }
}

main().catch((err) => {
  console.error('[ingest-csv] ERREUR :', err.message);
  process.exit(1);
});
