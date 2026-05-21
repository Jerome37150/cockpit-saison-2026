// =============================================================================
// CANAUX — { mois: { SEO, SEA, DIRECT, REFERRAL, SOCIAL, IA, CRM } }
//
// Source : Piano Analytics (`piano.json` → byChannel).
// =============================================================================

import piano from '../sources/piano.json';
import { CANAL_KEY, ACTIVE_MONTHS, monthOfIso } from '../shared/constants.js';
import { emptyMonthObjects } from '../shared/helpers.js';
import { pianoSchema, validate } from '../shared/schemas.js';

const data = validate(pianoSchema, piano, 'piano.json');

const buildCanaux = () => {
  const out = emptyMonthObjects();

  data.byChannel.forEach((r) => {
    if (r.annee !== 2026 || r.typePeriode !== 'Réel') return;
    const m = monthOfIso(r.mois);
    const k = CANAL_KEY[r.canal];
    if (!m || !(m in out) || !k) return;
    out[m][k] = (out[m][k] ?? 0) + (r.trafic ?? 0);
  });

  // Garantir que toutes les clés sont présentes (null si absentes)
  ACTIVE_MONTHS.forEach((m) => {
    Object.values(CANAL_KEY).forEach((k) => {
      if (!(k in out[m])) out[m][k] = null;
    });
  });
  return out;
};

export const CANAUX = buildCanaux();

// -----------------------------------------------------------------------------
// CANAUX_BY_ISO : { '2026-01-01': { SEO, SEA, DIRECT, ... }, ... }
// Combine toutes les années Piano dans une clé ISO unique.
// -----------------------------------------------------------------------------

export const CANAUX_BY_ISO = (() => {
  const out = {};
  data.byChannel.forEach((r) => {
    const k = CANAL_KEY[r.canal];
    if (!r.mois || !k) return;
    if (!out[r.mois]) out[r.mois] = {};
    out[r.mois][k] = (out[r.mois][k] ?? 0) + (r.trafic ?? 0);
  });
  return out;
})();
