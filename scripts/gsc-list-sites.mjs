#!/usr/bin/env node
/**
 * gsc-list-sites.mjs
 * ----------------------------------------------------------------------------
 * Liste les propriétés Google Search Console accessibles via OAuth utilisateur.
 *
 * Pré-requis dans .env :
 *   GSC_OAUTH_CLIENT_ID
 *   GSC_OAUTH_CLIENT_SECRET
 *   GSC_OAUTH_REFRESH_TOKEN  (obtenu via `node scripts/gsc-oauth.mjs`)
 *
 * Sert UNIQUEMENT à :
 *   1. Valider que l'auth fonctionne.
 *   2. Récupérer les `siteUrl` exacts (avec sc-domain: ou https://) à mettre
 *      dans GSC_SITES.
 *
 * Usage : node scripts/gsc-list-sites.mjs
 * ============================================================================
 */

import { config as loadEnv } from 'dotenv';
import { google } from 'googleapis';

loadEnv();

const {
  GSC_OAUTH_CLIENT_ID,
  GSC_OAUTH_CLIENT_SECRET,
  GSC_OAUTH_REFRESH_TOKEN,
} = process.env;

if (!GSC_OAUTH_CLIENT_ID || !GSC_OAUTH_CLIENT_SECRET || !GSC_OAUTH_REFRESH_TOKEN) {
  console.error('[gsc-list] ERREUR : creds OAuth GSC manquantes dans .env');
  console.error('  → Lance d\'abord : node scripts/gsc-oauth.mjs');
  process.exit(1);
}

const auth = new google.auth.OAuth2(GSC_OAUTH_CLIENT_ID, GSC_OAUTH_CLIENT_SECRET);
auth.setCredentials({ refresh_token: GSC_OAUTH_REFRESH_TOKEN });

const searchconsole = google.searchconsole({ version: 'v1', auth });

const { data } = await searchconsole.sites.list();
const sites = data.siteEntry ?? [];

if (sites.length === 0) {
  console.log('[gsc-list] Aucune propriété accessible avec ce compte.');
  process.exit(0);
}

console.log(`[gsc-list] ${sites.length} propriété(s) accessibles :\n`);
for (const s of sites) {
  console.log(`  ${s.permissionLevel.padEnd(18)}  ${s.siteUrl}`);
}

console.log('\n→ Copie les `siteUrl` voulus dans .env (GSC_SITES) au format MARCHE:URL,');
console.log('  ex : FR:sc-domain:campingdirect.com,DE:https://www.campingdirekt.de/');
