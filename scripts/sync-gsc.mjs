#!/usr/bin/env node
/**
 * sync-gsc.mjs
 * ----------------------------------------------------------------------------
 * Synchronise les données Google Search Console vers src/data/sources/gsc.json.
 *
 * Sert UNIQUEMENT au panneau SEO_MARCHES (snapshot positions par marché).
 * Le trafic SEO et les clickouts vivent dans piano.json.
 *
 * Pré-requis (à brancher au moment du go-live) :
 *   1. Créer un service account Google Cloud avec le scope
 *      `https://www.googleapis.com/auth/webmasters.readonly`.
 *   2. Donner accès à ce service account aux propriétés GSC concernées
 *      (ctoutvert.com, et tous les portails).
 *   3. Mettre la clé dans `.env` :
 *        GSC_SERVICE_ACCOUNT_JSON=<contenu JSON ou chemin vers le fichier .json>
 *        GSC_SITES=FR:https://www.campingdirect.com/,DE:...   (marché → URL site)
 *
 * Usage : npm run sync-gsc
 *
 * Schéma cible : src/data/shared/schemas.js → gscSchema
 * Doc          : docs/sources-gsc.md
 *
 * ⚠️ Limites GSC à connaître :
 *   - top 1000 queries par requête (échantillonnage au-delà)
 *   - `position` est une moyenne pondérée par impression
 *   - Pas de volume de recherche (à ajouter via tracker tiers si nécessaire)
 * ============================================================================
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv();

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = resolve(ROOT, 'src/data/sources/gsc.json');

const { GSC_SERVICE_ACCOUNT_JSON, GSC_SITES } = process.env;

if (!GSC_SERVICE_ACCOUNT_JSON) {
  console.error('[sync-gsc] ERREUR : GSC_SERVICE_ACCOUNT_JSON absent du .env');
  process.exit(1);
}

// GSC_SITES = "FR:https://www.campingdirect.com/,DE:https://..."
const SITES = Object.fromEntries(
  (GSC_SITES || '').split(',').filter(Boolean).map((p) => {
    const idx = p.indexOf(':');
    return [p.slice(0, idx), p.slice(idx + 1)];
  }),
);

// -----------------------------------------------------------------------------
// TODO : implémenter via googleapis (à installer : npm i googleapis)
// -----------------------------------------------------------------------------

/**
 * Pour un site GSC, récupère le top N queries des 30 derniers jours,
 * puis bucketise par position pour produire { kw, top3, top4_10, page2, nonClasse }.
 *
 * Pseudo-implémentation :
 *   const response = await searchconsole.searchanalytics.query({
 *     siteUrl, requestBody: {
 *       startDate, endDate, dimensions: ['query'], rowLimit: 1000,
 *     },
 *   });
 *   for (const row of response.data.rows) {
 *     const pos = row.position;
 *     if (pos <= 3)        top3++;
 *     else if (pos <= 10)  top4_10++;
 *     else if (pos <= 20)  page2++;
 *     else                 nonClasse++;
 *   }
 *   return { kw: response.data.rows.length, top3, top4_10, page2, nonClasse, volumeRech: null };
 *
 * @param {string} marche - code marché (FR, EN, NL, IT, DE, ES)
 * @param {string} siteUrl - URL GSC du site
 */
async function fetchMarketSnapshot(marche, siteUrl) {
  // TODO
  throw new Error(`[sync-gsc] fetchMarketSnapshot non implémenté (${marche}).`);
}

// -----------------------------------------------------------------------------
// Run
// -----------------------------------------------------------------------------

async function main() {
  console.log('[sync-gsc] Démarrage — marchés :', Object.keys(SITES).join(', ') || '(aucun)');

  const today = new Date().toISOString().slice(0, 10);
  const perMarket = await Promise.all(
    Object.entries(SITES).map(async ([marche, siteUrl]) => {
      const snapshot = await fetchMarketSnapshot(marche, siteUrl);
      return { marche, snapshotDate: today, ...snapshot };
    }),
  );

  const output = {
    syncedAt: new Date().toISOString(),
    _about: 'Google Search Console — généré par scripts/sync-gsc.mjs',
    perMarket,
  };

  await writeFile(OUTPUT, JSON.stringify(output, null, 2) + '\n');
  console.log(`[sync-gsc] OK → ${OUTPUT}`);
}

main().catch((err) => {
  console.error('[sync-gsc] ERREUR :', err.message);
  process.exit(1);
});
