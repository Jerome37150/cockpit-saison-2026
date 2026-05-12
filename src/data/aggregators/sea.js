// =============================================================================
// SEA — perf mensuelle (trafic + clickouts + budget), répartition par pays,
// liste des campagnes en cours.
//
// Sources :
//   - Piano  (`piano.json` → byChannel.SEA, seaByCountry) pour trafic + clickouts
//   - Inaxel (`inaxel/sea.json` → budgetByCountry, campagnes) pour budget + Google Ads
// =============================================================================

import piano from '../sources/piano.json';
import seaInaxel from '../sources/inaxel/sea.json';
import { ACTIVE_MONTHS, monthOfIso } from '../shared/constants.js';
import { safeDiv } from '../shared/helpers.js';
import { pianoSchema, seaSchema, validate } from '../shared/schemas.js';

const pianoData = validate(pianoSchema, piano, 'piano.json');
const seaData = validate(seaSchema, seaInaxel, 'inaxel/sea.json');

const buildSeaPerf = () => {
  const out = {};
  ACTIVE_MONTHS.forEach((m) => {
    const trafic = pianoData.byChannel
      .filter(
        (r) =>
          r.annee === 2026 &&
          r.canal === 'SEA' &&
          r.typePeriode === 'Réel' &&
          monthOfIso(r.mois) === m,
      )
      .reduce((s, r) => s + (r.trafic ?? 0), 0);
    const traficN1 = pianoData.byChannel
      .filter(
        (r) =>
          r.canal === 'SEA' &&
          r.typePeriode === 'N-1' &&
          monthOfIso(r.mois) === m,
      )
      .reduce((s, r) => s + (r.trafic ?? 0), 0);

    const clickoutsRows = pianoData.seaByCountry.filter(
      (r) => r.annee === 2026 && r.typePeriode === 'Réel' && monthOfIso(r.mois) === m,
    );
    const clickouts = clickoutsRows.reduce((s, r) => s + (r.clickouts ?? 0), 0);

    const budgetRows = seaData.budgetByCountry.filter(
      (r) => r.annee === 2026 && r.typePeriode === 'Réel' && monthOfIso(r.mois) === m,
    );
    const budget = budgetRows.reduce((s, r) => s + (r.budget ?? 0), 0);

    out[m] = {
      trafic: trafic || null,
      clickouts: clickouts || null,
      n1Trafic: traficN1 || null,
      n1Clickouts: null, // pas de N-1 sur clickouts SEA pour l'instant
      budget: budget || null,
      txConv: safeDiv(clickouts, trafic),
    };
  });
  return out;
};

export const SEA_PERF = buildSeaPerf();

// SEA par pays — fusion clickouts (Piano) + budget (Inaxel).
export const SEA_PAYS = (() => {
  const byPays = {};
  const ensure = (key) => {
    if (!byPays[key]) {
      byPays[key] = {
        pays: key,
        clickoutsReel: 0,
        clickoutsObj: 0,
        budgetReel: 0,
        budgetObj: 0,
      };
    }
    return byPays[key];
  };
  pianoData.seaByCountry.forEach((r) => {
    if (r.annee !== 2026) return;
    const e = ensure(r.pays);
    if (r.typePeriode === 'Réel') e.clickoutsReel += r.clickouts ?? 0;
    else if (r.typePeriode === 'Prévi') e.clickoutsObj += r.clickouts ?? 0;
  });
  seaData.budgetByCountry.forEach((r) => {
    if (r.annee !== 2026) return;
    const e = ensure(r.pays);
    if (r.typePeriode === 'Réel') e.budgetReel += r.budget ?? 0;
    else if (r.typePeriode === 'Prévi') e.budgetObj += r.budget ?? 0;
  });
  return Object.values(byPays).sort((a, b) => b.clickoutsObj - a.clickoutsObj);
})();

export const SEA_CAMPAGNES = seaData.campagnes;
