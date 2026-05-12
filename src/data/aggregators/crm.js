// =============================================================================
// CRM — base abonnés mensuelle, perf newsletters, snapshot par langue,
// planning campagnes 2026.
//
// Source : Inaxel (`inaxel/crm.json`) — export plateforme email (Brevo /
// Mailchimp / etc.) déposé par l'agent IA.
// =============================================================================

import crm from '../sources/inaxel/crm.json';
import { ACTIVE_MONTHS, monthOfIso } from '../shared/constants.js';
import { crmSchema, validate } from '../shared/schemas.js';

const data = validate(crmSchema, crm, 'inaxel/crm.json');

export const CRM_BASE = (() => {
  const out = {};
  ACTIVE_MONTHS.forEach((m) => {
    const r = data.base.find((x) => x.annee === 2026 && monthOfIso(x.mois) === m);
    out[m] = r
      ? {
          total: r.totalContacts,
          positionnes: r.positionnes,
          nouveaux: r.nouveaux,
          desabos: r.desabos,
          netGrowth: r.netGrowth,
          txDesab: r.txDesab,
        }
      : null;
  });
  return out;
})();

export const CRM_NL = (() => {
  const out = {};
  ACTIVE_MONTHS.forEach((m) => {
    const r = data.newsletter.find((x) => x.annee === 2026 && monthOfIso(x.mois) === m);
    out[m] = r
      ? {
          delivrabilite: r.txDelivrabilite,
          ouverture: r.txOuverture,
          clic: r.txClic,
          desab: r.txDesab,
          nb: r.nouveaux ?? null,
        }
      : null;
  });
  return out;
})();

export const CRM_LANGUE = data.langue
  .map((r) => ({
    langue: r.langue,
    positionnes: r.positionnes,
    txOuv: r.txOuverture,
    txClic: r.txClic,
    txDesab: r.txDesab,
  }))
  .sort((a, b) => (b.positionnes ?? 0) - (a.positionnes ?? 0));

export const CRM_CAMPAGNES = data.campagnes;
