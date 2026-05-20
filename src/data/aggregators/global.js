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
import { ACTIVE_MONTHS } from '../shared/constants.js';
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
