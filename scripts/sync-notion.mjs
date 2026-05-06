#!/usr/bin/env node
/**
 * sync-notion.mjs
 * ----------------------------------------------------------------------------
 * Synchronise les 7 bases Notion du Cockpit Saison 2026 vers
 * `src/data/cockpit-2026.notion.json`.
 *
 * Pré-requis :
 *   1. Créer une "Internal Integration" Notion :
 *      https://www.notion.so/profile/integrations
 *   2. Partager la page "Cockpit Saison 2026" (et toutes ses sous-pages)
 *      avec cette intégration : sur Notion, ouvrir la page → "..." →
 *      "Add connections" → choisir l'intégration.
 *   3. Mettre le secret dans un `.env` à la racine du projet :
 *        NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *
 * Usage :
 *   npm run sync-notion
 * ============================================================================
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Client } from '@notionhq/client';

loadEnv();

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = resolve(ROOT, 'src/data/cockpit-2026.notion.json');

const TOKEN = process.env.NOTION_TOKEN;
if (!TOKEN) {
  console.error('[sync-notion] ERREUR : NOTION_TOKEN absent du .env');
  process.exit(1);
}

const notion = new Client({ auth: TOKEN });

// IDs des 7 data sources de la page "Cockpit Saison 2026"
const SOURCES = {
  portails:     'b6683ef2-9a63-4543-9b83-a4fb5f82d06a',
  reservations: '835beaab-78af-4aaa-ba2b-984510dc8efa',
  canaux:       '6075bc36-9412-4c56-b763-1af80bcb8de6',
  seaPays:      'd5c78fec-2ba7-40d0-9c9e-7f1569824978',
  seo:          '67688ba8-1999-4dab-81ff-3cb5ff0d4c18',
  crm:          '3e59298d-be0a-40bd-b232-acd06dd33154',
  budget:       'ad122f69-66b8-4829-bd52-c710d58d6c08',
};

// -----------------------------------------------------------------------------
// Helpers d'extraction de propriétés Notion -> valeurs scalaires
// -----------------------------------------------------------------------------

const num = (p) => (p?.number ?? null);
const sel = (p) => p?.select?.name ?? null;
const date = (p) => p?.date?.start ?? null;
const txt = (p) =>
  p?.title?.map((t) => t.plain_text).join('') ??
  p?.rich_text?.map((t) => t.plain_text).join('') ??
  null;

// -----------------------------------------------------------------------------
// Pagination — récupère toutes les pages d'une data source
// -----------------------------------------------------------------------------

async function queryAll(dataSourceId) {
  const out = [];
  let cursor;
  do {
    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
      page_size: 100,
    });
    out.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return out;
}

// -----------------------------------------------------------------------------
// Mappers — un par base
// -----------------------------------------------------------------------------

const mappers = {
  portails: (p) => ({
    annee:     num(p['Année']),
    mois:      date(p['Mois']),
    portail:   sel(p['Portail']),
    type:      sel(p['Type']),
    origine:   sel(p['Origine']),
    trafic:    num(p['Trafic']),
    clickouts: num(p['Clickouts']),
  }),
  reservations: (p) => ({
    annee:           num(p['Année']),
    mois:            date(p['Mois']),
    typePeriode:     sel(p['Type Période']),
    typeReservation: sel(p['Type Réservation']),
    ca:              num(p['CA']),
    volumeResa:      num(p['Volume Résa']),
  }),
  canaux: (p) => ({
    annee:       num(p['Année']),
    mois:        date(p['Mois']),
    typePeriode: sel(p['Type Période']),
    canal:       sel(p['Canal']),
    trafic:      num(p['Trafic']),
  }),
  seaPays: (p) => ({
    annee:       num(p['Année']),
    mois:        date(p['Mois']),
    typePeriode: sel(p['Type Période']),
    pays:        sel(p['Pays']),
    budget:      num(p['Budget']),
    clickouts:   num(p['Clickouts']),
  }),
  seo: (p) => ({
    annee:           num(p['Année']),
    mois:            date(p['Mois']),
    granularite:     sel(p['Granularité']),
    marche:          sel(p['Marché']),
    portail:         sel(p['Portail']),
    typePeriode:     sel(p['Type Période']),
    origine:         sel(p['Origine']),
    trafic:          num(p['Trafic']),
    clickouts:       num(p['Clickouts']),
    motsClesTrackes: num(p['Mots-clés trackés']),
    volumeRech:      num(p['Volume rech.']),
    top3:            num(p['Top 3']),
    top4_10:         num(p['Top 4-10']),
    page2:           num(p['Page 2+']),
    nonClasse:       num(p['Non classé']),
  }),
  crm: (p) => ({
    annee:           num(p['Année']),
    mois:            date(p['Mois']),
    granularite:     sel(p['Granularité']),
    langue:          sel(p['Langue']),
    totalContacts:   num(p['Total contacts']),
    positionnes:     num(p['Positionnés']),
    nouveaux:        num(p['Nouveaux']),
    desabos:         num(p['Désabos']),
    netGrowth:       num(p['Net growth']),
    txDelivrabilite: num(p['Tx délivrabilité']),
    txOuverture:     num(p['Tx ouverture']),
    txClic:          num(p['Tx clic']),
    txDesab:         num(p['Tx désab.']),
  }),
  budget: (p) => ({
    annee:       num(p['Année']),
    categorie:   sel(p['Catégorie']),
    levier:      sel(p['Levier']),
    produit:     sel(p['Produit']),
    metrique:    sel(p['Métrique']),
    periode:     txt(p['Période']),
    typePeriode: sel(p['Type Période']),
    montant:     num(p['Montant (€)']),
    volume:      num(p['Volume']),
  }),
};

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main() {
  console.log('[sync-notion] Démarrage…');
  const result = { syncedAt: new Date().toISOString() };

  for (const [key, dsId] of Object.entries(SOURCES)) {
    process.stdout.write(`  · ${key.padEnd(12)} `);
    const pages = await queryAll(dsId);
    result[key] = pages.map((page) => mappers[key](page.properties));
    console.log(`✓ ${pages.length} rows`);
  }

  await writeFile(OUTPUT, JSON.stringify(result, null, 2), 'utf8');
  console.log(`[sync-notion] Écrit : ${OUTPUT}`);
}

main().catch((err) => {
  console.error('[sync-notion] ÉCHEC :', err);
  process.exit(1);
});
