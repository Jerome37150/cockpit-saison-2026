#!/usr/bin/env node
/**
 * gsc-oauth.mjs
 * ----------------------------------------------------------------------------
 * One-shot : récupère un refresh_token Google Search Console via OAuth user.
 *
 * Pré-requis dans .env :
 *   GSC_OAUTH_CLIENT_ID     (OAuth 2.0 Client ID type "Desktop app", projet ctv-kpi)
 *   GSC_OAUTH_CLIENT_SECRET
 *
 * Usage : node scripts/gsc-oauth.mjs
 *
 * Le script :
 *   1. Affiche une URL de consentement Google
 *   2. Écoute le retour OAuth sur http://localhost:53682
 *   3. Échange le code contre un refresh_token
 *   4. Affiche la ligne à coller dans .env
 *
 * ⚠️ Si l'app OAuth est en mode "Testing", le refresh_token expire à J+7.
 *    Pour usage long terme : publier l'app en Production (aucune vérification
 *    Google requise pour le scope webmasters.readonly à usage personnel).
 * ============================================================================
 */

import { createServer } from 'node:http';
import { config as loadEnv } from 'dotenv';
import { google } from 'googleapis';

loadEnv();

const { GSC_OAUTH_CLIENT_ID, GSC_OAUTH_CLIENT_SECRET } = process.env;

if (!GSC_OAUTH_CLIENT_ID || !GSC_OAUTH_CLIENT_SECRET) {
  console.error('[gsc-oauth] ERREUR : GSC_OAUTH_CLIENT_ID/SECRET absents du .env');
  process.exit(1);
}

const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}`;

const oauth2Client = new google.auth.OAuth2(
  GSC_OAUTH_CLIENT_ID,
  GSC_OAUTH_CLIENT_SECRET,
  REDIRECT_URI,
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/webmasters.readonly'],
});

console.log('\n[gsc-oauth] 1) Ouvre cette URL dans ton navigateur :\n');
console.log(authUrl);
console.log(`\n[gsc-oauth] 2) En attente du retour OAuth sur ${REDIRECT_URI} ...\n`);

const server = createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get('code');
  const err = url.searchParams.get('error');

  if (err) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>Erreur OAuth : ${err}</h1>`);
    console.error('[gsc-oauth] ERREUR Google :', err);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>OK — tu peux fermer cet onglet.</h1>');
    server.close();

    if (!tokens.refresh_token) {
      console.error('[gsc-oauth] ERREUR : pas de refresh_token reçu.');
      console.error('  → Va sur https://myaccount.google.com/permissions, révoque');
      console.error('    l\'accès de l\'app, et recommence (le prompt=consent est forcé).');
      process.exit(1);
    }

    console.log('\n[gsc-oauth] OK — refresh_token obtenu.\n');
    console.log('Ajoute cette ligne dans .env :');
    console.log('');
    console.log(`GSC_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('');
    console.log('Puis lance : node scripts/gsc-list-sites.mjs');
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>Erreur échange token : ${e.message}</h1>`);
    console.error('[gsc-oauth] ERREUR échange :', e.message);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT);
