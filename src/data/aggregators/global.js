// =============================================================================
// GLOBAL / GLOBAL_N1 / GLOBAL_OBJ — agrégats trafic, clickouts, résa, CA par mois.
//
// Sources :
//   - Piano (`piano.json` → perPortail) pour trafic + clickouts
//   - Inaxel (`inaxel/reservations.json`) pour résa + CA
// =============================================================================

import piano from '../sources/piano.json';
import reservations from '../sources/inaxel/reservations.json';
import { ACTIVE_MONTHS } from '../shared/constants.js';
import { sumByMonth, safeDiv, sumDirAndApp } from '../shared/helpers.js';
import { pianoSchema, reservationsSchema, validate } from '../shared/schemas.js';

const pianoData = validate(pianoSchema, piano, 'piano.json');
const resaData = validate(reservationsSchema, reservations, 'inaxel/reservations.json');

const sumPortailField = (field, type, annee = 2026) =>
  sumByMonth(
    pianoData.perPortail,
    (r) => r[field],
    (r) => r.annee === annee && r.type === type,
  );

const sumReservationField = (field, typePeriode, typeReservation, annee = 2026) =>
  sumByMonth(
    resaData.rows,
    (r) => r[field],
    (r) =>
      r.annee === annee &&
      r.typePeriode === typePeriode &&
      r.typeReservation === typeReservation,
  );

const buildGlobal = () => {
  const trafic = sumPortailField('trafic', 'Réel');
  const clickouts = sumPortailField('clickouts', 'Réel');
  const resaDir = sumReservationField('volumeResa', 'Réel', 'Directe');
  const resaApp = sumReservationField('volumeResa', 'Réel', 'Apporteur');
  const totalResa = sumReservationField('volumeResa', 'Réel', 'Total');
  const ca = sumReservationField('ca', 'Réel', 'Total');
  const caDir = sumReservationField('ca', 'Réel', 'Directe');
  const caApp = sumReservationField('ca', 'Réel', 'Apporteur');

  const out = {};
  ACTIVE_MONTHS.forEach((m) => {
    const totalResaM = totalResa[m] ?? sumDirAndApp(resaDir[m], resaApp[m]);
    const caM = ca[m] ?? sumDirAndApp(caDir[m], caApp[m]);
    out[m] = {
      trafic: trafic[m],
      clickouts: clickouts[m],
      resaDir: resaDir[m],
      resaApp: resaApp[m],
      totalResa: totalResaM,
      ca: caM,
      txConvCO: safeDiv(clickouts[m], trafic[m]),
      txConvResa: safeDiv(totalResaM, trafic[m]),
    };
  });
  return out;
};

export const GLOBAL = buildGlobal();

const buildGlobalN1 = () => {
  const trafic = sumPortailField('trafic', 'N-1');
  const clickouts = sumPortailField('clickouts', 'N-1');
  const resaDir = sumReservationField('volumeResa', 'N-1', 'Directe');
  const resaApp = sumReservationField('volumeResa', 'N-1', 'Apporteur');
  const totalResa = sumReservationField('volumeResa', 'N-1', 'Total');
  const ca = sumReservationField('ca', 'N-1', 'Total');
  const caDir = sumReservationField('ca', 'N-1', 'Directe');
  const caApp = sumReservationField('ca', 'N-1', 'Apporteur');

  const out = {};
  ACTIVE_MONTHS.forEach((m) => {
    const totalResaM = totalResa[m] ?? sumDirAndApp(resaDir[m], resaApp[m]);
    const caM = ca[m] ?? sumDirAndApp(caDir[m], caApp[m]);
    out[m] = {
      trafic: trafic[m],
      clickouts: clickouts[m],
      resaDir: resaDir[m],
      resaApp: resaApp[m],
      totalResa: totalResaM,
      ca: caM,
    };
  });
  return out;
};

export const GLOBAL_N1 = buildGlobalN1();

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
