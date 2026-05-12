#!/usr/bin/env node
/**
 * piano-probe.mjs
 * ----------------------------------------------------------------------------
 * Sonde l'API Piano Data Query v3 avec 4 requêtes simples pour valider les
 * noms de colonnes et de dimensions attendus par sync-piano.mjs AVANT de coder
 * les vrais fetchers.
 *
 * Cible : portail CD (Camping Direct), avril 2026 (mois complet le plus récent).
 *
 * Tests :
 *   1. m_visits total                       → valide auth + colonne trafic
 *   2. m_visits par src_channel             → valide dimension canal + nommage
 *   3. m_events_count_clickout total        → valide colonne clickout (event custom)
 *   4. m_visits par geo_country             → valide dimension pays (pour SEA)
 *
 * Usage : node scripts/piano-probe.mjs
 * ============================================================================
 */

import { config as loadEnv } from 'dotenv';
loadEnv();

const { PIANO_API_KEY, PIANO_API_SECRET, PIANO_SITES } = process.env;
if (!PIANO_API_KEY || !PIANO_API_SECRET) {
  console.error('[probe] PIANO_API_KEY / PIANO_API_SECRET absents.');
  process.exit(1);
}

const SITES = Object.fromEntries(
  (PIANO_SITES || '').split(',').filter(Boolean).map((p) => p.split(':')),
);
const CD = SITES.CD;
if (!CD) {
  console.error('[probe] PIANO_SITES.CD manquant — on a besoin d\'au moins CD pour sonder.');
  process.exit(1);
}

const auth = Buffer.from(`${PIANO_API_KEY}:${PIANO_API_SECRET}`).toString('base64');
const URL = 'https://api.atinternet.io/v3/data/getData';
const PERIOD = { p1: [{ type: 'D', start: '2026-04-01', end: '2026-04-30' }] };

async function query(label, body) {
  console.log(`\n──── ${label}`);
  console.log('Body :', JSON.stringify(body));
  const res = await fetch(URL, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  console.log(`HTTP ${res.status}`);
  if (!res.ok) {
    console.log('Erreur :', json?.ErrorMessage || json?.error || text.slice(0, 300));
    return null;
  }
  const rows = json?.DataFeed?.Rows ?? json?.Rows ?? [];
  console.log(`Rows : ${rows.length}`);
  if (rows.length) {
    console.log(`Sample (max 20) :`);
    for (const r of rows.slice(0, 20)) console.log('  ', JSON.stringify(r));
  } else if (json) {
    console.log('Réponse top-level keys :', Object.keys(json).join(', '));
    console.log('Aperçu :', JSON.stringify(json).slice(0, 400));
  }
  return json;
}

console.log(`[probe] Site CD = ${CD}, période avril 2026.`);

const COMMON = {
  space: { s: [Number(CD)] },
  period: PERIOD,
  'max-results': 50,
  'page-num': 1,
};

// Test 1 — m_visits total (sort obligatoire)
await query('Test 1 — m_visits total', {
  ...COMMON,
  columns: ['m_visits'],
  sort: ['-m_visits'],
  'max-results': 5,
});

// Test 2 — m_visits par src_type (au lieu de src_channel)
await query('Test 2a — m_visits par src_type', {
  ...COMMON,
  columns: ['src_type', 'm_visits'],
  sort: ['-m_visits'],
});

// Test 2b — alternative src_source_type
await query('Test 2b — m_visits par src_source_type', {
  ...COMMON,
  columns: ['src_source_type', 'm_visits'],
  sort: ['-m_visits'],
});

// Test 2c — alternative mv_src_type (multi-attribution)
await query('Test 2c — m_visits par mv_src_type', {
  ...COMMON,
  columns: ['mv_src_type', 'm_visits'],
  sort: ['-m_visits'],
});

// Test 3 — geo_country
await query('Test 3 — m_visits par geo_country', {
  ...COMMON,
  columns: ['geo_country', 'm_visits'],
  sort: ['-m_visits'],
  'max-results': 10,
});

// Test 4 — events custom : exploration noms
await query('Test 4a — m_events total', {
  ...COMMON,
  columns: ['m_events'],
  sort: ['-m_events'],
  'max-results': 5,
});

// Test 4b — par nom d'event pour repérer "clickout"
await query('Test 4b — events par event_name (top 20)', {
  ...COMMON,
  columns: ['event_name', 'm_events'],
  sort: ['-m_events'],
  'max-results': 20,
});

// Test 5 — granularité mensuelle (pour les fetchers qui aggregent par mois)
await query('Test 5 — m_visits par month', {
  ...COMMON,
  columns: ['date_month', 'm_visits'],
  sort: ['date_month'],
  'max-results': 12,
  period: { p1: [{ type: 'D', start: '2026-01-01', end: '2026-04-30' }] },
});

// Test 6 — granularité canal plus fine
await query('Test 6a — m_visits par src (source name)', {
  ...COMMON,
  columns: ['src', 'm_visits'],
  sort: ['-m_visits'],
  'max-results': 15,
});

await query('Test 6b — m_visits par src_detail', {
  ...COMMON,
  columns: ['src_detail', 'm_visits'],
  sort: ['-m_visits'],
  'max-results': 15,
});

await query('Test 6c — m_visits par src_medium', {
  ...COMMON,
  columns: ['src_medium', 'm_visits'],
  sort: ['-m_visits'],
  'max-results': 15,
});

// Test 7 — filtre sur event_name pour isoler le clickout
await query('Test 7 — m_events filtré sur click_out.cta_camping', {
  ...COMMON,
  columns: ['m_events'],
  sort: ['-m_events'],
  'max-results': 5,
  filter: {
    metric: {},
    property: { event_name: { $eq: 'click_out.cta_camping' } },
  },
});

// Test 8 — query cross-sites (tous les portails en une fois)
await query('Test 8 — m_visits par site (cross-portail)', {
  ...COMMON,
  columns: ['site', 'm_visits'],
  space: { s: Object.values(SITES).map(Number) },
  sort: ['-m_visits'],
  'max-results': 10,
});

// Test 9 — toutes les valeurs de src (pour voir Social / IA)
await query('Test 9 — m_visits par src (TOUTES les sources)', {
  ...COMMON,
  columns: ['src', 'm_visits'],
  sort: ['-m_visits'],
  'max-results': 50,
});

// Test 10 — filter property sans metric (syntaxe alternative)
await query('Test 10a — filter property only', {
  ...COMMON,
  columns: ['m_events'],
  sort: ['-m_events'],
  'max-results': 5,
  filter: { property: { event_name: { $eq: 'click_out.cta_camping' } } },
});

// Test 10b — filter avec metric:undefined
await query('Test 10b — filter sans key metric', {
  ...COMMON,
  columns: ['m_events'],
  sort: ['-m_events'],
  'max-results': 5,
  filter: {
    property: { $and: [{ event_name: { $eq: 'click_out.cta_camping' } }] },
  },
});

// Test 11 — TOP 30 events pour visualiser tous les click_out.* à l'œil
await query('Test 11 — top 30 events_name (vue d\'ensemble)', {
  ...COMMON,
  columns: ['event_name', 'm_events'],
  sort: ['-m_events'],
  'max-results': 30,
});

// Test 12 — opérateurs filter string : $lk / $rlk / $regex
await query('Test 12a — filter $lk click_out%', {
  ...COMMON,
  columns: ['event_name', 'm_events'],
  sort: ['-m_events'],
  'max-results': 10,
  filter: { property: { event_name: { $lk: 'click_out%' } } },
});

await query('Test 12b — filter $rlk ^click_out', {
  ...COMMON,
  columns: ['event_name', 'm_events'],
  sort: ['-m_events'],
  'max-results': 10,
  filter: { property: { event_name: { $rlk: '^click_out' } } },
});

console.log('\n[probe] Fin.');
