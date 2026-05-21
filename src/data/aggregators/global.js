// =============================================================================
// GLOBAL / GLOBAL_N1 / GLOBAL_OBJ — agrégats trafic, clickouts, résa, CA par mois.
//
// Sources :
//   - Piano (`piano.json` → perPortail) pour trafic + clickouts
//   - Secure Holiday (`secureholiday.json` → perMonth) pour résa + CA
//     - "Directe"   = bookings via les portails CTV (Pack Trafic)
//     - "Apporteur" = bookings via partenaires/apporteurs (Pack Trafic Apporteurs)
//     - "Total"     = somme des deux (calculée à la volée)
// =============================================================================

import piano from '../sources/piano.json';
import secureholiday from '../sources/secureholiday.json';
import { ACTIVE_MONTHS, COCKPIT_YEAR } from '../shared/constants.js';
import { sumByMonth, safeDiv, sumDirAndApp } from '../shared/helpers.js';
import { pianoSchema, secureholidaySchema, validate } from '../shared/schemas.js';

const pianoData = validate(pianoSchema, piano, 'piano.json');
const shData = validate(secureholidaySchema, secureholiday, 'secureholiday.json');

const sumPortailField = (field, type, annee = 2026) =>
  sumByMonth(
    pianoData.perPortail,
    (r) => r[field],
    (r) => r.annee === annee && r.type === type,
  );

// Secure Holiday : somme par mois pour un typeReservation + année.
// Pour 2026 (Réel) → annee=2026 ; pour la comparaison N-1 → annee=2025.
const sumSHField = (field, typeReservation, annee = 2026) =>
  sumByMonth(
    shData.perMonth,
    (r) => r[field],
    (r) => r.annee === annee && r.typeReservation === typeReservation,
  );

const buildPeriode = (annee, { withConversions = false } = {}) => {
  const typePiano = annee === 2026 ? 'Réel' : 'N-1';
  const trafic = sumPortailField('trafic', typePiano);
  const clickouts = sumPortailField('clickouts', typePiano);
  const resaDir = sumSHField('volumeResa', 'Directe', annee);
  const resaApp = sumSHField('volumeResa', 'Apporteur', annee);
  const caDir = sumSHField('ca', 'Directe', annee);
  const caApp = sumSHField('ca', 'Apporteur', annee);

  const out = {};
  ACTIVE_MONTHS.forEach((m) => {
    const totalResaM = sumDirAndApp(resaDir[m], resaApp[m]);
    const caM = sumDirAndApp(caDir[m], caApp[m]);
    out[m] = {
      trafic: trafic[m],
      clickouts: clickouts[m],
      resaDir: resaDir[m],
      resaApp: resaApp[m],
      totalResa: totalResaM,
      ca: caM,
      ...(withConversions
        ? {
            txConvCO: safeDiv(clickouts[m], trafic[m]),
            txConvResa: safeDiv(totalResaM, trafic[m]),
          }
        : {}),
    };
  });
  return out;
};

export const GLOBAL = buildPeriode(2026, { withConversions: true });
export const GLOBAL_N1 = buildPeriode(2025);

const buildGlobalObj = () => {
  const trafic = sumPortailField('trafic', 'Objectif');
  const clickouts = sumPortailField('clickouts', 'Objectif');
  const out = {};
  ACTIVE_MONTHS.forEach((m) => {
    out[m] = { trafic: trafic[m], clickouts: clickouts[m] };
  });
  return out;
};

export const GLOBAL_OBJ = buildGlobalObj();

// -----------------------------------------------------------------------------
// GLOBAL_BY_ISO : même payload mais keyé par ISO YYYY-MM-01 (combine 2026 + 2025).
// Permet aux pages d'itérer sur periodIsoMonths/compareIsoMonths quelle que soit
// l'année (donc cross-année sans bug).
// -----------------------------------------------------------------------------

const MONTH_NUM = Object.fromEntries(ACTIVE_MONTHS.map((m, i) => [m, String(i + 1).padStart(2, '0')]));

export const GLOBAL_BY_ISO = (() => {
  const out = {};
  ACTIVE_MONTHS.forEach((m) => {
    const num = MONTH_NUM[m];
    if (!num) return;
    out[`${COCKPIT_YEAR}-${num}-01`] = GLOBAL[m];
    out[`${COCKPIT_YEAR - 1}-${num}-01`] = GLOBAL_N1[m];
  });
  return out;
})();

export const GLOBAL_OBJ_BY_ISO = (() => {
  const out = {};
  ACTIVE_MONTHS.forEach((m) => {
    const num = MONTH_NUM[m];
    if (!num) return;
    // Objectif n'a pas de N-1, on l'expose juste pour l'année courante.
    out[`${COCKPIT_YEAR}-${num}-01`] = GLOBAL_OBJ[m];
  });
  return out;
})();
