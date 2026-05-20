#!/usr/bin/env node
/**
 * sync-secureholiday.mjs
 * ----------------------------------------------------------------------------
 * Extraction quotidienne depuis monitoring.secureholiday.net via Playwright.
 *
 * 3 exports :
 *   A. Statistiques Ventes → Pack Trafic
 *   B. Statistiques Ventes → Pack Trafic Apporteurs
 *   C. Stats Clicks
 *
 * Range de dates par défaut : J-1 seulement. Surchargeable via --from/--to.
 *
 * Sortie : data/raw/secureholiday/{export-name}/{YYYY-MM-DD}.csv
 *          (ou {from}_to_{to}.csv si range multi-jours)
 *
 * Usage :
 *   node scripts/sync-secureholiday.mjs                             # hier
 *   node scripts/sync-secureholiday.mjs --from 2026-05-01 --to 2026-05-19
 *   HEADFUL=1 node scripts/sync-secureholiday.mjs                   # browser visible (debug)
 * ============================================================================
 */

import { chromium } from 'playwright';
import { config as loadEnv } from 'dotenv';
import { mkdir } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// dotenv : on lui passe explicitement le chemin du .env à la racine du projet
// (sinon il prend process.cwd() qui n'est pas garanti d'être ROOT selon
// l'invocation : `npm run` vs `node scripts/...` vs job CI).
loadEnv({ path: resolve(ROOT, '.env') });

const { SECUREHOLIDAY_USER, SECUREHOLIDAY_PASSWORD } = process.env;

if (!SECUREHOLIDAY_USER || !SECUREHOLIDAY_PASSWORD) {
  console.error('[sh] ERREUR : SECUREHOLIDAY_USER / SECUREHOLIDAY_PASSWORD absents du .env');
  process.exit(1);
}

// ----- args ------------------------------------------------------------------

const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : null;
};

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const isoFmt = (d) => d.toISOString().slice(0, 10);

const FROM = getArg('from') ?? isoFmt(yesterday);
const TO = getArg('to') ?? isoFmt(yesterday);
const HEADFUL = process.env.HEADFUL === '1';

if (!/^\d{4}-\d{2}-\d{2}$/.test(FROM) || !/^\d{4}-\d{2}-\d{2}$/.test(TO)) {
  console.error(`[sh] Dates invalides (attendu YYYY-MM-DD) : from=${FROM} to=${TO}`);
  process.exit(1);
}

console.log(`[sh] Fenêtre : ${FROM} → ${TO}${HEADFUL ? ' (headful)' : ''}`);

const OUT_BASE = join(ROOT, 'data', 'raw', 'secureholiday');

// ----- helpers ---------------------------------------------------------------

const toFr = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const fileLabel = () => (FROM === TO ? FROM : `${FROM}_to_${TO}`);

async function setDate(page, inputSelector, iso) {
  // Stratégie clavier (frappes "trusted") plutôt que dispatchEvent synthétique :
  // les widgets datepicker custom n'écoutent souvent que les vrais événements clavier
  // (event.isTrusted === true) pour mettre à jour leur state interne. Sinon le serveur
  // reçoit une valeur figée même si le DOM affiche la bonne date.
  const [y, m, d] = iso.split('-').map(Number);
  const fr = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  const input = page.locator(inputSelector);
  await input.click();
  await input.fill(''); // efface la valeur existante de façon fiable
  await input.pressSequentially(fr, { delay: 20 });
  await input.press('Tab'); // commit + blur (ferme le calendrier si ouvert)
}

async function saveDownload(download, exportName) {
  const outDir = join(OUT_BASE, exportName);
  await mkdir(outDir, { recursive: true });
  const ext = (download.suggestedFilename().split('.').pop() ?? 'csv').toLowerCase();
  const outPath = join(outDir, `${fileLabel()}.${ext}`);
  await download.saveAs(outPath);
  console.log(`[sh]   ↳ ${outPath}`);
  return outPath;
}

async function login(page) {
  console.log('[sh] Login…');
  await page.goto('https://monitoring.secureholiday.net/Account/Login');
  await page.getByRole('textbox', { name: 'Entrez votre login' }).fill(SECUREHOLIDAY_USER);
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill(SECUREHOLIDAY_PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/Account/Login'), {
    timeout: 15000,
  });
  console.log('[sh] Login OK');
}

// ----- export A : Pack Trafic ------------------------------------------------
async function exportPackTrafic(page) {
  console.log('[sh] Export A : Pack Trafic');
  await page.getByRole('link', { name: 'Statistiques Ventes' }).click();
  await page.getByRole('link', { name: 'Pack Trafic', exact: true }).click();
  await setDate(page, '#SaleDateViewModel_BeginSelectedDate', FROM);
  await setDate(page, '#SaleDateViewModel_EndIncludedSelectedDate', TO);
  await page.getByRole('checkbox', { name: 'Détail complet des ventes' }).check();
  await page.getByRole('checkbox', { name: 'Sortie Total' }).uncheck();
  await page.getByRole('checkbox', { name: 'Par établissement et par moteur' }).uncheck();
  const downloadPromise = page.waitForEvent('download', { timeout: 60_000 });
  await page.getByRole('button', { name: 'Générer les tableaux' }).click();
  const download = await downloadPromise;
  await saveDownload(download, 'pack-trafic');
}

// ----- export B : Pack Trafic Apporteurs -------------------------------------
async function exportPackTraficApporteurs(page) {
  console.log('[sh] Export B : Pack Trafic Apporteurs');
  await page.getByRole('link', { name: 'Pack Trafic Apporteurs' }).click();
  await setDate(page, '#SaleDateViewModel_BeginSelectedDate', FROM);
  await setDate(page, '#SaleDateViewModel_EndIncludedSelectedDate', TO);
  // Le label "Pack E-Trafic" est suivi d'un compteur dynamique (nb de ventes sur la plage).
  // On cible donc juste "Pack E-Trafic" et on prend le 1er (section "Ventes individuelles
  // provenant des Packs/moteurs", la 1re dans le DOM ; cf. #BusinessFacilitatorIndiv-PT
  // dans le codegen original).
  await page.getByRole('checkbox', { name: /Pack E-Trafic/ }).first().check();
  await page.getByText('Détail complet des ventes').click();
  await page.getByRole('checkbox', { name: 'Par mois et par apporteur' }).uncheck();
  await page.getByRole('checkbox', { name: 'Sortie Total' }).uncheck();
  const downloadPromise = page.waitForEvent('download', { timeout: 60_000 });
  await page.getByRole('button', { name: 'Générer les tableaux' }).click();
  const download = await downloadPromise;
  await saveDownload(download, 'pack-trafic-apporteurs');
}

// ----- export C : Stats Clicks -----------------------------------------------
async function exportStatsClicks(page) {
  console.log('[sh] Export C : Stats Clicks');
  await page.getByRole('button', { name: ' Retour au monitoring' }).click();
  await page.getByRole('link', { name: 'Stats Clicks' }).click();
  await page.getByRole('checkbox', { name: 'Pay-Per-Click Pack' }).check();
  await page.getByRole('checkbox', { name: 'E-Traffic Pack' }).check();
  await setDate(page, '#LogDateBegin1', FROM);
  await setDate(page, '#LogDateEnd1', TO);
  await page.getByRole('checkbox', { name: 'Establishment' }).check();
  const downloadPromise = page.waitForEvent('download', { timeout: 60_000 });
  await page.getByRole('button', { name: '📊 Xls' }).click();
  const download = await downloadPromise;
  await saveDownload(download, 'stats-clicks');
}

// ----- main ------------------------------------------------------------------

const browser = await chromium.launch({ headless: !HEADFUL });
const context = await browser.newContext({
  acceptDownloads: true,
  // Force locale FR : sur les runners GitHub (Ubuntu, locale C.UTF-8),
  // sans ça l'UI Secure Holiday est servie en anglais et les sélecteurs
  // type "Statistiques Ventes" ne matchent plus.
  locale: 'fr-FR',
  timezoneId: 'Europe/Paris',
});
const page = await context.newPage();

try {
  await login(page);
  await exportPackTrafic(page);
  await exportPackTraficApporteurs(page);
  await exportStatsClicks(page);
  console.log('[sh] Terminé sans erreur.');
} catch (err) {
  console.error('[sh] ÉCHEC :', err.message);
  try {
    const shotPath = join(OUT_BASE, `_error-${Date.now()}.png`);
    await mkdir(dirname(shotPath), { recursive: true });
    await page.screenshot({ path: shotPath, fullPage: true });
    console.error(`[sh] Screenshot d'erreur sauvegardé : ${shotPath}`);
  } catch {
    /* screenshot best-effort */
  }
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}
