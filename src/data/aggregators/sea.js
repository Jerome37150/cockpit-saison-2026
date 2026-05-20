// =============================================================================
// SEA — perf mensuelle (trafic + clickouts) et répartition par pays.
//
// Source unique : Piano (`piano.json` → byChannel.SEA, seaByCountry).
//
// CE QUI A CHANGÉ depuis la dépréciation de sea.json :
//   - SEA_PERF.budget = null (était dans sea.json par mois × pays)
//   - SEA_PERF.coutParClickout = null (dérive du budget)
//   - SEA_PAYS.budgetReel/Obj = 0 (idem)
//   - SEA_CAMPAGNES = null (liste Google Ads inconnue de Piano)
//
// Pour récupérer le budget total annuel SEA il y a un proxy partiel via
// secureholiday.json statsClicks.perEngine.budget (somme des engines PPC*)
// mais pas de ventilation mensuelle ni par pays.
// =============================================================================

import piano from '../sources/piano.json';
import { ACTIVE_MONTHS, monthOfIso } from '../shared/constants.js';
import { safeDiv } from '../shared/helpers.js';
import { pianoSchema, validate } from '../shared/schemas.js';

const pianoData = validate(pianoSchema, piano, 'piano.json');

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
        (r) => r.canal === 'SEA' && r.typePeriode === 'N-1' && monthOfIso(r.mois) === m,
      )
      .reduce((s, r) => s + (r.trafic ?? 0), 0);

    const clickouts = pianoData.seaByCountry
      .filter((r) => r.annee === 2026 && r.typePeriode === 'Réel' && monthOfIso(r.mois) === m)
      .reduce((s, r) => s + (r.clickouts ?? 0), 0);

    out[m] = {
      trafic: trafic || null,
      clickouts: clickouts || null,
      n1Trafic: traficN1 || null,
      n1Clickouts: null,
      budget: null, // source supprimée
      coutParClickout: null, // dépend du budget
      txConv: safeDiv(clickouts, trafic),
    };
  });
  return out;
};

export const SEA_PERF = buildSeaPerf();

// Par pays : clickouts depuis Piano, budget = 0 (source supprimée).
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
  return Object.values(byPays).sort((a, b) => b.clickoutsObj - a.clickoutsObj);
})();

// La liste des campagnes Google Ads n'a pas d'équivalent dans Piano.
export const SEA_CAMPAGNES = null;
