// =============================================================================
// Constantes partagées : mois, codes portails / canaux, palettes.
// Tout ce qui ne dépend pas d'une source vit ici.
// =============================================================================

export const MONTHS = ['janvier', 'février', 'mars', 'avril', 'cumul'];

// Mois "actifs" sur lesquels les aggregators itèrent (sans le pseudo-mois cumul).
// À étendre quand la saison avance.
export const ACTIVE_MONTHS = ['janvier', 'février', 'mars', 'avril'];

export const MONTH_LABELS = {
  janvier: 'Janvier 2026',
  février: 'Février 2026',
  mars: 'Mars 2026',
  avril: 'Avril 2026',
  cumul: 'Cumul Jan→Avr 2026',
};

const FRENCH_MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

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
