// =============================================================================
// SEO — perf mensuelle agrégée + détail par portail (Piano)
//      + snapshot positions par marché (GSC).
//
// Sources :
//   - Piano (`piano.json` → seoMonthly + seoPerPortail) pour trafic + clickouts
//   - GSC   (`gsc.json`   → perMarket) pour SEO_MARCHES (positions bucketées)
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

export const SEO_MARCHES = gscData.perMarket.map((r) => ({
  marche: r.marche,
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
