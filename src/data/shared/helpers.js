// =============================================================================
// Helpers d'agrégation génériques. Dépendent uniquement de `shared/constants`.
// =============================================================================

import { ACTIVE_MONTHS, monthOfIso } from './constants.js';

export const emptyMonthValues = () =>
  Object.fromEntries(ACTIVE_MONTHS.map((m) => [m, null]));

export const emptyMonthObjects = () =>
  Object.fromEntries(ACTIVE_MONTHS.map((m) => [m, {}]));

// Somme un champ numérique sur les rows, regroupé par mois actif.
export const sumByMonth = (rows, getValue, filter = () => true) => {
  const out = emptyMonthValues();
  rows.filter(filter).forEach((r) => {
    const m = monthOfIso(r.mois);
    if (!m || !(m in out)) return;
    const v = getValue(r);
    if (typeof v !== 'number') return;
    out[m] = (out[m] ?? 0) + v;
  });
  return out;
};

export const safeDiv = (a, b) =>
  a == null || b == null || b === 0 ? null : a / b;

// Si une row "Total" est absente, on somme Directe + Apporteur.
export const sumDirAndApp = (a, b) => {
  if (a == null && b == null) return null;
  return (a ?? 0) + (b ?? 0);
};
