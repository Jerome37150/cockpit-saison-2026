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

// Manipulation de périodes "YYYY-MM" (format de <input type="month">)
// -----------------------------------------------------------------------------

export const isoToYM = (iso) => (iso ? String(iso).slice(0, 7) : null);
export const ymToIso = (ym) => (ym ? `${ym}-01` : null);

// Liste les ISO YYYY-MM-01 entre 2 YYYY-MM (inclus).
export const isoMonthsBetween = (fromYM, toYM) => {
  if (!fromYM || !toYM || fromYM > toYM) return [];
  const result = [];
  let [y, m] = fromYM.split('-').map(Number);
  const [endY, endM] = toYM.split('-').map(Number);
  while (y < endY || (y === endY && m <= endM)) {
    result.push(`${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-01`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return result;
};

// Décale un YYYY-MM d'un nombre d'années (négatif = passé).
export const shiftYMByYears = (ym, deltaYears) => {
  if (!ym) return null;
  const [y, m] = ym.split('-');
  return `${parseInt(y, 10) + deltaYears}-${m}`;
};

// Libellé "Jan 2026 → Mai 2026" pour afficher une plage.
export const formatPeriodLabel = (fromYM, toYM) => {
  if (!fromYM || !toYM) return '—';
  const monthShort = (ym) => {
    const [y, m] = ym.split('-');
    const idx = parseInt(m, 10) - 1;
    return `${(FRENCH_MONTHS[idx] ?? '').slice(0, 3)} ${y}`;
  };
  if (fromYM === toYM) return monthShort(fromYM);
  return `${monthShort(fromYM)} → ${monthShort(toYM)}`;
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
