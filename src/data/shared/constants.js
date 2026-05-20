// =============================================================================
// Constantes partagées : mois, codes portails / canaux, palettes.
// Tout ce qui ne dépend pas d'une source vit ici.
// =============================================================================

const FRENCH_MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Année courante (Réel) du cockpit — utilisée pour les libellés de mois.
export const COCKPIT_YEAR = 2026;

// Tous les mois calendaires + le pseudo-mois "cumul" qui sert au sélecteur.
export const MONTHS = [...FRENCH_MONTHS, 'cumul'];

// Mois itérés par les aggregators (sans le pseudo "cumul").
// Couvre l'année calendaire complète — les sources définissent quels mois
// ont effectivement des données (les autres affichent null).
export const ACTIVE_MONTHS = [...FRENCH_MONTHS];

export const MONTH_LABELS = {
  ...Object.fromEntries(FRENCH_MONTHS.map((m) => [m, `${cap(m)} ${COCKPIT_YEAR}`])),
  cumul: `Cumul Janvier→Décembre ${COCKPIT_YEAR}`,
};

// Convertit un ISO date "YYYY-MM-DD" en nom de mois français.
// Année-agnostique : fonctionne pour 2025, 2026, 2027... pareil.
export const monthOfIso = (iso) => {
  if (!iso) return null;
  const m = String(iso).match(/^\d{4}-(\d{2})/);
  if (!m) return null;
  const idx = parseInt(m[1], 10) - 1;
  return FRENCH_MONTHS[idx] ?? null;
};

// Codes portails (utilisés tels quels dans les sources et dans la UI).
export const PORTAIL_CODES = ['CD', 'C2B', 'CSV', 'IB', 'AC', 'UC', 'MC'];

// Mapping nom du canal (Piano) → code interne utilisé par la UI.
export const CANAL_KEY = {
  SEO: 'SEO',
  SEA: 'SEA',
  Direct: 'DIRECT',
  Referral: 'REFERRAL',
  'Social Media': 'SOCIAL',
  'IA Générative': 'IA',
  CRM: 'CRM',
};

export const LEVIER_COLORS = {
  SEO: '#22D3CC',
  SEA: '#0E9E96',
  Direct: '#7FE6E0',
  IA: '#FBBF24',
  RS: '#A78BFA',
  CRM: '#F472B6',
};

export const SEA_TYPE_COLORS = {
  Brand: '#22D3CC',
  Generic: '#FBBF24',
  Concurrents: '#F87171',
  Display: '#A78BFA',
  Retargeting: '#F472B6',
};
