// =============================================================================
// PORTAILS — { mois: { CD: {trafic, clickouts, n1, n1Clickouts}, ... } }
// + PORTAIL_ORIGINE — { CD: 'Réel'|'Fictif', ... }
//
// Source : Piano Analytics (`piano.json` → perPortail).
// =============================================================================

import piano from '../sources/piano.json';
import { PORTAIL_CODES, monthOfIso } from '../shared/constants.js';
import { emptyMonthObjects } from '../shared/helpers.js';
import { pianoSchema, validate } from '../shared/schemas.js';

const data = validate(pianoSchema, piano, 'piano.json');

const blank = () => ({ trafic: null, clickouts: null, n1: null, n1Clickouts: null });

const buildPortails = () => {
  const out = emptyMonthObjects();

  data.perPortail.forEach((r) => {
    if (r.annee !== 2026 || r.type !== 'Réel') return;
    const m = monthOfIso(r.mois);
    if (!m || !(m in out) || !PORTAIL_CODES.includes(r.portail)) return;
    out[m][r.portail] = out[m][r.portail] || blank();
    out[m][r.portail].trafic = r.trafic ?? null;
    out[m][r.portail].clickouts = r.clickouts ?? null;
  });

  data.perPortail.forEach((r) => {
    if (r.type !== 'N-1') return;
    const m = monthOfIso(r.mois);
    if (!m || !(m in out) || !PORTAIL_CODES.includes(r.portail)) return;
    out[m][r.portail] = out[m][r.portail] || blank();
    out[m][r.portail].n1 = r.trafic ?? null;
    out[m][r.portail].n1Clickouts = r.clickouts ?? null;
  });

  return out;
};

export const PORTAILS = buildPortails();

// Origine de la donnée pour chaque portail (Réel par défaut, Fictif si une
// row trafic du portail a Origine = "Fictif").
export const PORTAIL_ORIGINE = (() => {
  const out = {};
  PORTAIL_CODES.forEach((code) => {
    const rows = data.perPortail.filter((r) => r.portail === code);
    const hasFictif = rows.some((r) => r.origine === 'Fictif');
    out[code] = hasFictif ? 'Fictif' : 'Réel';
  });
  return out;
})();
