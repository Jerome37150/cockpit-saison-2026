// =============================================================================
// SEO — perf mensuelle agrégée + détail par portail (Piano)
//      + snapshot positions par marché (GSC).
//
// Sources :
//   - Piano (`piano.json` → seoMonthly + seoPerPortail) pour trafic + clickouts
//   - GSC   (`gsc.json`   → perMarketPerPortail) pour SEO_MARCHES (positions
//           bucketées, sommées par marché à travers les portails).
//
// ⚠️ `volume` (volume de recherche) n'est pas exposé par GSC nativement.
// Tant qu'aucun tracker tiers (Semrush / SE Ranking) n'est branché, il reste null.
// =============================================================================

import piano from '../sources/piano.json';
import gsc from '../sources/gsc.json';
import { PORTAIL_CODES, ACTIVE_MONTHS, monthOfIso } from '../shared/constants.js';
import { safeDiv } from '../shared/helpers.js';
import { pianoSchema, gscSchema, validate } from '../shared/schemas.js';

const pianoData = validate(pianoSchema, piano, 'piano.json');
const gscData = validate(gscSchema, gsc, 'gsc.json');

const buildSeoPerf = () => {
  const out = {};
  ACTIVE_MONTHS.forEach((m) => {
    const reel = pianoData.seoMonthly.find(
      (r) => r.annee === 2026 && r.typePeriode === 'Réel' && monthOfIso(r.mois) === m,
    );
    const n1 = pianoData.seoMonthly.find(
      (r) => r.typePeriode === 'N-1' && monthOfIso(r.mois) === m,
    );
    out[m] = {
      trafic: reel?.trafic ?? null,
      clickouts: reel?.clickouts ?? null,
      n1Trafic: n1?.trafic ?? null,
      n1Clickouts: n1?.clickouts ?? null,
      txConv: safeDiv(reel?.clickouts, reel?.trafic),
    };
  });
  return out;
};

export const SEO_PERF = buildSeoPerf();

// Somme les colonnes numériques par marché à travers les portails GSC.
// `null` est traité comme absent (pas comme 0) : un marché dont tous les portails
// ont `volumeRech: null` reste `volume: null`, pas `volume: 0`.
const sumByMarche = (rows, key) => {
  const defined = rows.map((r) => r[key]).filter((v) => v != null);
  return defined.length === 0 ? null : defined.reduce((a, b) => a + b, 0);
};

export const SEO_MARCHES = (() => {
  const byMarche = new Map();
  gscData.perMarketPerPortail.forEach((r) => {
    if (!byMarche.has(r.marche)) byMarche.set(r.marche, []);
    byMarche.get(r.marche).push(r);
  });
  return Array.from(byMarche.entries()).map(([marche, rows]) => ({
    marche,
    kw:        sumByMarche(rows, 'kw'),
    volume:    sumByMarche(rows, 'volumeRech'),
    top3:      sumByMarche(rows, 'top3'),
    top4_10:   sumByMarche(rows, 'top4_10'),
    page2:     sumByMarche(rows, 'page2'),
    nonClasse: sumByMarche(rows, 'nonClasse'),
  }));
})();

// Granularité (marché × portail) — pour la page SEO d'analyse détaillée.
// Garde l'ordre d'origine du JSON (qui suit MARCHES × portails de gsc-sites.mjs).
export const SEO_MARCHES_PER_PORTAIL = gscData.perMarketPerPortail.map((r) => ({
  marche: r.marche,
  portail: r.portail,
  snapshotDate: r.snapshotDate,
  kw: r.kw,
  volume: r.volumeRech,
  top3: r.top3,
  top4_10: r.top4_10,
  page2: r.page2,
  nonClasse: r.nonClasse,
}));

// Performance SEO mensuelle par portail (CD, C2B, CSV, IB, AC, UC, MC).
// Retourne { monthly: { mois: { trafic, clickouts, n1Trafic, n1Clickouts, txConv } }, origine }
export const SEO_PER_PORTAIL = (() => {
  const out = {};
  PORTAIL_CODES.forEach((code) => {
    const rows = pianoData.seoPerPortail.filter((r) => r.portail === code);
    const monthly = {};
    let origine = null;
    ACTIVE_MONTHS.forEach((m) => {
      const reel = rows.find(
        (r) => r.annee === 2026 && r.typePeriode === 'Réel' && monthOfIso(r.mois) === m,
      );
      const n1 = rows.find(
        (r) => r.typePeriode === 'N-1' && monthOfIso(r.mois) === m,
      );
      if (reel?.origine === 'Fictif' || n1?.origine === 'Fictif') origine = 'Fictif';
      else if (reel?.origine === 'Réel' || n1?.origine === 'Réel') origine = origine ?? 'Réel';
      monthly[m] = {
        trafic: reel?.trafic ?? null,
        clickouts: reel?.clickouts ?? null,
        n1Trafic: n1?.trafic ?? null,
        n1Clickouts: n1?.clickouts ?? null,
        txConv: safeDiv(reel?.clickouts, reel?.trafic),
      };
    });
    out[code] = { monthly, origine };
  });
  return out;
})();
