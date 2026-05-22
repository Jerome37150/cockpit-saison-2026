#!/usr/bin/env node
/**
 * sync-gsc.mjs
 * ----------------------------------------------------------------------------
 * Synchronise les données Google Search Console vers src/data/sources/gsc.json.
 *
 * Sert UNIQUEMENT au panneau SEO_MARCHES (snapshot positions par marché,
 * agrégé depuis les portails GSC — cf. SEO_PER_PORTAIL pour la suite).
 *
 * Pré-requis :
 *   1. OAuth 2.0 Client ID type "Desktop app" dans le projet GCP `ctv-kpi`,
 *      app OAuth publiée en Production (scope webmasters.readonly).
 *   2. Variables dans .env :
 *        GSC_OAUTH_CLIENT_ID
 *        GSC_OAUTH_CLIENT_SECRET
 *        GSC_OAUTH_REFRESH_TOKEN   (obtenu via `node scripts/gsc-oauth.mjs`)
 *   3. Mapping marché × portail → siteUrl dans `scripts/gsc-sites.mjs`.
 *
 * Usage : npm run sync-gsc
 *
 * Schéma cible : src/data/shared/schemas.js → gscSchema
 * Doc          : docs/sources-gsc.md
 *
 * ⚠️ Limites GSC à connaître :
 *   - top 25 000 queries par requête (échantillonnage au-delà)
 *   - `position` est une moyenne pondérée par impression
 *   - Pas de volume de recherche (à alimenter via tracker tiers si besoin)
 * ============================================================================
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { google } from 'googleapis';

import { GSC_SITES } from './gsc-sites.mjs';

loadEnv();

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = resolve(ROOT, 'src/data/sources/gsc.json');

const {
  GSC_OAUTH_CLIENT_ID,
  GSC_OAUTH_CLIENT_SECRET,
  GSC_OAUTH_REFRESH_TOKEN,
} = process.env;

if (!GSC_OAUTH_CLIENT_ID || !GSC_OAUTH_CLIENT_SECRET || !GSC_OAUTH_REFRESH_TOKEN) {
  console.error('[sync-gsc] ERREUR : creds OAuth GSC manquantes dans .env');
  console.error('  → Lance d\'abord : node scripts/gsc-oauth.mjs');
  process.exit(1);
}

const auth = new google.auth.OAuth2(GSC_OAUTH_CLIENT_ID, GSC_OAUTH_CLIENT_SECRET);
auth.setCredentials({ refresh_token: GSC_OAUTH_REFRESH_TOKEN });
const searchconsole = google.searchconsole({ version: 'v1', auth });

// Fenêtre : 30 derniers jours (J-3 pour laisser GSC consolider).
const today = new Date();
const endDate = new Date(today);
endDate.setDate(endDate.getDate() - 3);
const startDate = new Date(endDate);
startDate.setDate(startDate.getDate() - 30);
const fmt = (d) => d.toISOString().slice(0, 10);

const START_DATE = fmt(startDate);
const END_DATE = fmt(endDate);

/**
 * Pour 1 site GSC, récupère toutes les queries (top 25 000) sur la fenêtre,
 * puis bucketise par position moyenne.
 * @param {string} siteUrl - URL GSC (https://... ou sc-domain:...)
 * @returns {Promise<{kw, top3, top4_10, page2, nonClasse, volumeRech}>}
 */
async function fetchSiteSnapshot(siteUrl) {
  const { data } = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: START_DATE,
      endDate: END_DATE,
      dimensions: ['query'],
      rowLimit: 25000,
    },
  });

  const rows = data.rows ?? [];
  let top3 = 0, top4_10 = 0, page2 = 0, nonClasse = 0;
  for (const r of rows) {
    const pos = r.position;
    if (pos <= 3) top3++;
    else if (pos <= 10) top4_10++;
    else if (pos <= 20) page2++;
    else nonClasse++;
  }

  return {
    kw: rows.length,
    volumeRech: null, // ⚠️ pas dispo via GSC
    top3,
    top4_10,
    page2,
    nonClasse,
  };
}

async function main() {
  console.log(`[sync-gsc] Fenêtre : ${START_DATE} → ${END_DATE} (${GSC_SITES.length} sites)`);

  const snapshotDate = END_DATE;
  const perMarketPerPortail = [];

  // Séquentiel pour respecter les quotas GSC (1200 req/min par projet, large).
  for (const { marche, portail, siteUrl } of GSC_SITES) {
    process.stdout.write(`  ${marche}/${portail.padEnd(4)} ${siteUrl} ... `);
    try {
      const snapshot = await fetchSiteSnapshot(siteUrl);
      console.log(`OK (kw=${snapshot.kw})`);
      perMarketPerPortail.push({ marche, portail, snapshotDate, ...snapshot });
    } catch (e) {
      console.log(`ÉCHEC (${e.message})`);
      // On continue : un site qui plante ne doit pas casser tout le sync.
      perMarketPerPortail.push({
        marche, portail, snapshotDate,
        kw: null, volumeRech: null, top3: null, top4_10: null, page2: null, nonClasse: null,
      });
    }
  }

  const output = {
    syncedAt: new Date().toISOString(),
    _about: 'Google Search Console — généré par scripts/sync-gsc.mjs',
    perMarketPerPortail,
  };

  await writeFile(OUTPUT, JSON.stringify(output, null, 2) + '\n');
  console.log(`[sync-gsc] OK → ${OUTPUT}`);
}

main().catch((err) => {
  console.error('[sync-gsc] ERREUR :', err.message);
  process.exit(1);
});
