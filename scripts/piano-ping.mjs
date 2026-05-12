#!/usr/bin/env node
/**
 * piano-ping.mjs
 * ----------------------------------------------------------------------------
 * Vérifie que les credentials Piano Analytics (PIANO_API_KEY / PIANO_API_SECRET)
 * configurés dans .env permettent bien de joindre l'API Data Query v3.
 *
 * Ne fait AUCUN appel coûteux : juste un POST minimal sur /getData pour distinguer
 *   - 401 / 403  → credentials KO
 *   - 4xx autre  → credentials OK, requête mal formée (attendu ici, c'est le but)
 *   - 200        → tout marche
 *
 * Usage : node scripts/piano-ping.mjs
 * ============================================================================
 */

import { config as loadEnv } from 'dotenv';
loadEnv();

const { PIANO_API_KEY, PIANO_API_SECRET } = process.env;

if (!PIANO_API_KEY || !PIANO_API_SECRET) {
  console.error('[piano-ping] ERREUR : PIANO_API_KEY ou PIANO_API_SECRET absent du .env');
  process.exit(1);
}

const auth = Buffer.from(`${PIANO_API_KEY}:${PIANO_API_SECRET}`).toString('base64');

const today = new Date().toISOString().slice(0, 10);

// Requête minimaliste : 1 métrique, période courte, AUCUN site (on attend une
// erreur "site manquant" si auth OK → ce qui valide la clé sans lire de data).
const body = {
  columns: ['m_visits'],
  period: { p1: [{ type: 'D', start: today, end: today }] },
  space: { s: [] },
  'max-results': 1,
};

const url = 'https://api.atinternet.io/v3/data/getData';

console.log(`[piano-ping] POST ${url}`);
console.log(`[piano-ping] Access Key : ${PIANO_API_KEY.slice(0, 6)}…`);

const res = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

const text = await res.text();
let json;
try { json = JSON.parse(text); } catch { json = null; }

console.log(`[piano-ping] HTTP ${res.status} ${res.statusText}`);

if (res.status === 401 || res.status === 403) {
  console.error('  → Auth REFUSÉE. Vérifie PIANO_API_KEY / PIANO_API_SECRET.');
  console.error('  → Réponse brute :', text.slice(0, 400));
  process.exit(2);
}

if (res.ok) {
  console.log('  → Auth OK et requête acceptée (étrange avec space.s=[], mais OK).');
  console.log('  → Rows :', json?.DataFeed?.Rows?.length ?? '?');
  process.exit(0);
}

// 4xx autre que 401/403 : auth OK, requête mal formée → c'est ce qu'on espérait
console.log('  → Auth OK (erreur attendue car space.s vide).');
console.log('  → Détail API :', json?.ErrorMessage ?? json?.error ?? text.slice(0, 300));
console.log('\n[piano-ping] ✓ Credentials valides. Reste à remplir PIANO_SITES.');
