#!/usr/bin/env node
/**
 * piano-list-sites.mjs
 * ----------------------------------------------------------------------------
 * Cherche tous les sites Piano accessibles à la clé API en essayant plusieurs
 * endpoints candidats. Piano n'a pas (officiellement) un endpoint "list my sites"
 * dans l'API Data Query v3, mais en pratique plusieurs routes annexes l'exposent.
 *
 * Usage : node scripts/piano-list-sites.mjs
 * ============================================================================
 */

import { config as loadEnv } from 'dotenv';
loadEnv();

const { PIANO_API_KEY, PIANO_API_SECRET } = process.env;
if (!PIANO_API_KEY || !PIANO_API_SECRET) {
  console.error('[piano-list] ERREUR : PIANO_API_KEY ou PIANO_API_SECRET absent du .env');
  process.exit(1);
}

const auth = Buffer.from(`${PIANO_API_KEY}:${PIANO_API_SECRET}`).toString('base64');
const headers = {
  Authorization: `Basic ${auth}`,
  'Content-Type': 'application/json',
};

const CANDIDATES = [
  { method: 'GET',  url: 'https://api.atinternet.io/v3/data/getSitesList' },
  { method: 'POST', url: 'https://api.atinternet.io/v3/data/getStructure', body: {} },
  { method: 'GET',  url: 'https://api.atinternet.io/v3/data/getMetricsList' },
  { method: 'GET',  url: 'https://api.atinternet.io/v3/data/getDimensionsList' },
  { method: 'GET',  url: 'https://api.atinternet.io/data/v2/en/sites/' },
  { method: 'GET',  url: 'https://api.atinternet.io/v3/space/list' },
  { method: 'GET',  url: 'https://api.atinternet.io/v3/account/sites' },
];

async function tryOne({ method, url, body }) {
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } catch (err) {
    return { ok: false, status: 0, text: String(err.message) };
  }
}

console.log('[piano-list] Test des endpoints candidats…\n');

for (const c of CANDIDATES) {
  const r = await tryOne(c);
  const preview = (r.text || '').slice(0, 200).replace(/\n/g, ' ');
  console.log(`  ${r.status.toString().padStart(3)}  ${c.method.padEnd(4)} ${c.url}`);
  if (r.ok) {
    console.log(`       → ${preview}`);
  } else if (r.status >= 400 && r.status < 500 && r.text) {
    console.log(`       err: ${preview}`);
  }
}

console.log('\n[piano-list] Fin. Si aucun endpoint OK ci-dessus, cf fallback DevTools dans le chat.');
