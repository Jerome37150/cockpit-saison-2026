#!/usr/bin/env node
/**
 * gsc-list-sites.mjs
 * ----------------------------------------------------------------------------
 * Liste les propriétés Google Search Console accessibles au service account
 * configuré dans .env (GSC_SERVICE_ACCOUNT_JSON).
 *
 * Sert UNIQUEMENT à :
 *   1. Valider que l'auth fonctionne.
 *   2. Récupérer les `siteUrl` exacts (avec sc-domain: ou https://) à mettre
 *      dans GSC_SITES.
 *
 * Usage : node scripts/gsc-list-sites.mjs
 * ============================================================================
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, isAbsolute } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { google } from 'googleapis';

loadEnv();

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { GSC_SERVICE_ACCOUNT_JSON } = process.env;

if (!GSC_SERVICE_ACCOUNT_JSON) {
  console.error('[gsc-list] ERREUR : GSC_SERVICE_ACCOUNT_JSON absent du .env');
  process.exit(1);
}

const keyPath = isAbsolute(GSC_SERVICE_ACCOUNT_JSON)
  ? GSC_SERVICE_ACCOUNT_JSON
  : resolve(ROOT, GSC_SERVICE_ACCOUNT_JSON);

const credentials = JSON.parse(await readFile(keyPath, 'utf8'));

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});

const searchconsole = google.searchconsole({ version: 'v1', auth });

const { data } = await searchconsole.sites.list();
const sites = data.siteEntry ?? [];

if (sites.length === 0) {
  console.log('[gsc-list] Aucune propriété accessible.');
  console.log('  → Vérifie que kpi-ctv@ctv-kpi.iam.gserviceaccount.com est bien');
  console.log('    ajouté comme utilisateur (Restreint suffit) sur les propriétés GSC.');
  process.exit(0);
}

console.log(`[gsc-list] ${sites.length} propriété(s) accessibles :\n`);
for (const s of sites) {
  console.log(`  ${s.permissionLevel.padEnd(18)}  ${s.siteUrl}`);
}

console.log('\n→ Copie les `siteUrl` voulus dans .env (GSC_SITES) au format MARCHE:URL,');
console.log('  ex : FR:sc-domain:campingdirect.com,DE:https://www.campingdirekt.de/');
