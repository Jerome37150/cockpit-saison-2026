// =============================================================================
// Façade unique de la couche données.
// La UI importe tout depuis ce module : `import { GLOBAL, ... } from './data'`.
// =============================================================================

// Constantes partagées (mois, palettes)
export { MONTHS, MONTH_LABELS, SEA_TYPE_COLORS } from './shared/constants.js';

// Aggregators par section UI
export { GLOBAL, GLOBAL_N1, GLOBAL_OBJ, GLOBAL_BY_ISO, GLOBAL_OBJ_BY_ISO } from './aggregators/global.js';
export { PORTAILS, PORTAIL_ORIGINE, PORTAILS_BY_ISO } from './aggregators/portails.js';
export { CANAUX, CANAUX_BY_ISO } from './aggregators/canaux.js';
export { SEO_PERF, SEO_MARCHES, SEO_PER_PORTAIL } from './aggregators/seo.js';
export { SEA_PERF, SEA_PAYS, SEA_CAMPAGNES } from './aggregators/sea.js';
export { CRM_BASE, CRM_NL, CRM_LANGUE, CRM_CAMPAGNES } from './aggregators/crm.js';
export { BUDGET_LEVIERS, CA_PRODUITS, CAMPINGS } from './aggregators/budget.js';
export { CLIENTS } from './aggregators/clients.js';
export { SYNCED_AT, SYNCED_AT_BY_SOURCE } from './aggregators/meta.js';
