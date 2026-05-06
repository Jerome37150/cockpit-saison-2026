// =============================================================================
// Couche de transformation : rows brutes Notion -> structures attendues par
// les composants du cockpit. Tout le code de la UI consomme ce module ;
// `cockpit-2026.notion.json` est l'unique source de données.
// =============================================================================

import raw from './cockpit-2026.notion.json';

// -----------------------------------------------------------------------------
// Constantes générales
// -----------------------------------------------------------------------------

export const MONTHS = ['janvier', 'février', 'mars', 'avril', 'cumul'];
export const MONTH_LABELS = {
  janvier: 'Janvier 2026',
  février: 'Février 2026',
  mars: 'Mars 2026',
  avril: 'Avril 2026',
  cumul: 'Cumul Jan→Avr 2026',
};

const ISO_TO_MONTH = {
  '2026-01-01': 'janvier',
  '2026-02-01': 'février',
  '2026-03-01': 'mars',
  '2026-04-01': 'avril',
  '2025-01-01': 'janvier',
  '2025-02-01': 'février',
  '2025-03-01': 'mars',
  '2025-04-01': 'avril',
};

const monthOfIso = (iso) => ISO_TO_MONTH[iso] || null;

const PORTAIL_KEY = {
  CampingDirect: 'CD',
  Camping2Be: 'C2B',
  'Camping Street View': 'CSV',
  Ibericamp: 'IB',
  Alcampeggio: 'AC',
  Ucamping: 'UC',
  'My Camping': 'MC',
};

const CANAL_KEY = {
  SEO: 'SEO',
  SEA: 'SEA',
  Direct: 'DIRECT',
  Referral: 'REFERRAL',
  'Social Media': 'SOCIAL',
  'IA Générative': 'IA',
  CRM: 'CRM',
};

// -----------------------------------------------------------------------------
// Helpers internes
// -----------------------------------------------------------------------------

const empty = () => ({ janvier: null, février: null, mars: null, avril: null });
const emptyObj = () => ({ janvier: {}, février: {}, mars: {}, avril: {} });

const sumByMonth = (rows, getValue, filter = () => true) => {
  const out = empty();
  rows.filter(filter).forEach((r) => {
    const m = monthOfIso(r.mois);
    if (!m) return;
    const v = getValue(r);
    if (typeof v !== 'number') return;
    out[m] = (out[m] ?? 0) + v;
  });
  return out;
};

const safeDiv = (a, b) => (a == null || b == null || b === 0 ? null : a / b);

// -----------------------------------------------------------------------------
// PORTAILS — { mois: { CD: {trafic, n1}, ... } }
// -----------------------------------------------------------------------------

const buildPortails = () => {
  const out = emptyObj();
  const blank = () => ({ trafic: null, clickouts: null, n1: null, n1Clickouts: null });
  (raw.portails || []).forEach((r) => {
    if (r.annee !== 2026 || r.type !== 'Réel') return;
    const m = monthOfIso(r.mois);
    const k = PORTAIL_KEY[r.portail];
    if (!m || !k) return;
    out[m][k] = out[m][k] || blank();
    out[m][k].trafic = r.trafic ?? null;
    out[m][k].clickouts = r.clickouts ?? null;
  });
  // n1 : on associe le mois 2025-MM au même mois "logique"
  (raw.portails || []).forEach((r) => {
    if (r.type !== 'N-1') return;
    const m = monthOfIso(r.mois);
    const k = PORTAIL_KEY[r.portail];
    if (!m || !k) return;
    out[m][k] = out[m][k] || blank();
    out[m][k].n1 = r.trafic ?? null;
    out[m][k].n1Clickouts = r.clickouts ?? null;
  });
  return out;
};

export const PORTAILS = buildPortails();

// Origine de la donnée pour chaque portail (Réel par défaut, Fictif si la
// majorité des rows trafic du portail ont Origine = "Fictif").
export const PORTAIL_ORIGINE = (() => {
  const out = {};
  Object.entries(PORTAIL_KEY).forEach(([fullName, shortKey]) => {
    const rows = (raw.portails || []).filter((r) => r.portail === fullName);
    const hasFictif = rows.some((r) => r.origine === 'Fictif');
    out[shortKey] = hasFictif ? 'Fictif' : 'Réel';
  });
  return out;
})();

// -----------------------------------------------------------------------------
// GLOBAL : trafic + clickouts agrégés par mois
// -----------------------------------------------------------------------------

const sumPortailField = (field, type, annee = 2026) =>
  sumByMonth(
    raw.portails || [],
    (r) => r[field],
    (r) => r.annee === annee && r.type === type,
  );

const sumReservationField = (field, typePeriode, typeReservation, annee = 2026) =>
  sumByMonth(
    raw.reservations || [],
    (r) => r[field],
    (r) =>
      r.annee === annee &&
      r.typePeriode === typePeriode &&
      r.typeReservation === typeReservation,
  );

// Fallback : si Notion ne contient pas de row "Total" pour le CA / résa, on
// somme les rows "Directe" + "Apporteur".
const sumDirAndApp = (a, b) => {
  if (a == null && b == null) return null;
  return (a ?? 0) + (b ?? 0);
};

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
  ['janvier', 'février', 'mars', 'avril'].forEach((m) => {
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

// -----------------------------------------------------------------------------
// GLOBAL_N1
// -----------------------------------------------------------------------------

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
  ['janvier', 'février', 'mars', 'avril'].forEach((m) => {
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

// -----------------------------------------------------------------------------
// GLOBAL_OBJ : objectifs trafic + clickouts par mois
// -----------------------------------------------------------------------------

const buildGlobalObj = () => {
  const trafic = sumPortailField('trafic', 'Objectif');
  const clickouts = sumPortailField('clickouts', 'Objectif');
  const out = {};
  ['janvier', 'février', 'mars', 'avril'].forEach((m) => {
    out[m] = { trafic: trafic[m], clickouts: clickouts[m] };
  });
  return out;
};

export const GLOBAL_OBJ = buildGlobalObj();

// -----------------------------------------------------------------------------
// CANAUX : { mois: { SEO, SEA, DIRECT, REFERRAL, SOCIAL, IA, CRM } }
// -----------------------------------------------------------------------------

const buildCanaux = () => {
  const out = emptyObj();
  (raw.canaux || []).forEach((r) => {
    if (r.annee !== 2026 || r.typePeriode !== 'Réel') return;
    const m = monthOfIso(r.mois);
    const k = CANAL_KEY[r.canal];
    if (!m || !k) return;
    out[m][k] = (out[m][k] ?? 0) + (r.trafic ?? 0);
  });
  // garantir que toutes les clés sont présentes (null si absentes)
  ['janvier', 'février', 'mars', 'avril'].forEach((m) => {
    Object.values(CANAL_KEY).forEach((k) => {
      if (!(k in out[m])) out[m][k] = null;
    });
  });
  return out;
};

export const CANAUX = buildCanaux();

// -----------------------------------------------------------------------------
// SEO — perf mensuelle + snapshot marché
// -----------------------------------------------------------------------------

// Filtre : on prend uniquement les rows agrégat (sans Portail), le détail
// par portail vivant dans une seconde structure.
const seoMensuelleAgg = (raw.seo || []).filter(
  (r) => r.granularite === 'Mensuelle' && !r.portail,
);

const buildSeoPerf = () => {
  const out = {};
  ['janvier', 'février', 'mars', 'avril'].forEach((m) => {
    const reel = seoMensuelleAgg.find(
      (r) =>
        r.annee === 2026 &&
        r.typePeriode === 'Réel' &&
        monthOfIso(r.mois) === m,
    );
    const n1 = seoMensuelleAgg.find(
      (r) =>
        r.typePeriode === 'N-1' &&
        monthOfIso(r.mois) === m,
    );
    out[m] = {
      trafic: reel?.trafic ?? null,
      clickouts: reel?.clickouts ?? null,
      n1Trafic: n1?.trafic ?? null,
      n1Clickouts: n1?.clickouts ?? null,
      txConv: safeDiv(reel?.clickouts, reel?.trafic),
    };
  });
  return out;
};

export const SEO_PERF = buildSeoPerf();

export const SEO_MARCHES = (raw.seo || [])
  .filter((r) => r.granularite === 'Marché (snapshot)')
  .map((r) => ({
    marche: r.marche,
    kw: r.motsClesTrackes,
    volume: r.volumeRech,
    top3: r.top3,
    top4_10: r.top4_10,
    page2: r.page2,
    nonClasse: r.nonClasse,
  }));

// Performance SEO mensuelle par portail.
// Indexé par code court (CD, C2B, CSV, IB, AC, UC) pour matcher PORTAILS.
// Retourne { monthly: { mois: { trafic, clickouts, n1Trafic, n1Clickouts, txConv } }, origine: 'Réel'|'Fictif' }
export const SEO_PER_PORTAIL = (() => {
  const out = {};
  Object.entries(PORTAIL_KEY).forEach(([fullName, shortKey]) => {
    const rows = (raw.seo || []).filter(
      (r) => r.granularite === 'Mensuelle' && r.portail === fullName,
    );
    const monthly = {};
    let origine = null;
    ['janvier', 'février', 'mars', 'avril'].forEach((m) => {
      const reel = rows.find((r) => r.annee === 2026 && r.typePeriode === 'Réel' && monthOfIso(r.mois) === m);
      const n1 = rows.find((r) => r.typePeriode === 'N-1' && monthOfIso(r.mois) === m);
      if (reel?.origine === 'Fictif' || n1?.origine === 'Fictif') origine = 'Fictif';
      else if (reel?.origine === 'Réel' || n1?.origine === 'Réel') origine = origine ?? 'Réel';
      monthly[m] = {
        trafic: reel?.trafic ?? null,
        clickouts: reel?.clickouts ?? null,
        n1Trafic: n1?.trafic ?? null,
        n1Clickouts: n1?.clickouts ?? null,
        txConv: safeDiv(reel?.clickouts, reel?.trafic),
      };
    });
    out[shortKey] = { monthly, origine };
  });
  return out;
})();

// -----------------------------------------------------------------------------
// SEA — trafic acquis (DB3 Canaux), clickouts + budget (DB4 SEA & Pays cible)
// -----------------------------------------------------------------------------

const buildSeaPerf = () => {
  const out = {};
  ['janvier', 'février', 'mars', 'avril'].forEach((m) => {
    // Trafic acquis via SEA — DB3 Canaux (Réel + N-1)
    const trafic = (raw.canaux || [])
      .filter(
        (r) =>
          r.annee === 2026 &&
          r.canal === 'SEA' &&
          r.typePeriode === 'Réel' &&
          monthOfIso(r.mois) === m,
      )
      .reduce((s, r) => s + (r.trafic ?? 0), 0);
    const traficN1 = (raw.canaux || [])
      .filter(
        (r) =>
          r.canal === 'SEA' &&
          r.typePeriode === 'N-1' &&
          monthOfIso(r.mois) === m,
      )
      .reduce((s, r) => s + (r.trafic ?? 0), 0);

    // Clickouts SEA + budget — DB4 SEA & Pays cible (somme tous pays, Réel)
    const seaRows = (raw.seaPays || []).filter(
      (r) =>
        r.annee === 2026 &&
        r.typePeriode === 'Réel' &&
        monthOfIso(r.mois) === m,
    );
    const clickouts = seaRows.reduce((s, r) => s + (r.clickouts ?? 0), 0);
    const budget = seaRows.reduce((s, r) => s + (r.budget ?? 0), 0);

    out[m] = {
      trafic: trafic || null,
      clickouts: clickouts || null,
      n1Trafic: traficN1 || null,
      n1Clickouts: null, // Notion n'a pas de N-1 sur la base SEA Pays
      budget: budget || null,
      txConv: safeDiv(clickouts, trafic),
    };
  });
  return out;
};

export const SEA_PERF = buildSeaPerf();

// SEA par pays — agrégation cumulée (réel + objectif)
export const SEA_PAYS = (() => {
  const byPays = {};
  (raw.seaPays || []).forEach((r) => {
    if (r.annee !== 2026) return;
    const key = r.pays;
    if (!byPays[key]) {
      byPays[key] = {
        pays: key,
        clickoutsReel: 0,
        clickoutsObj: 0,
        budgetReel: 0,
        budgetObj: 0,
      };
    }
    if (r.typePeriode === 'Réel') {
      byPays[key].clickoutsReel += r.clickouts ?? 0;
      byPays[key].budgetReel += r.budget ?? 0;
    } else if (r.typePeriode === 'Prévi') {
      byPays[key].clickoutsObj += r.clickouts ?? 0;
      byPays[key].budgetObj += r.budget ?? 0;
    }
  });
  return Object.values(byPays).sort((a, b) => b.clickoutsObj - a.clickoutsObj);
})();

// -----------------------------------------------------------------------------
// CRM
// -----------------------------------------------------------------------------

export const CRM_BASE = (() => {
  const out = {};
  const rows = (raw.crm || []).filter(
    (r) => r.annee === 2026 && r.granularite === 'Base abonnés',
  );
  ['janvier', 'février', 'mars', 'avril'].forEach((m) => {
    const r = rows.find((x) => monthOfIso(x.mois) === m);
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
  const rows = (raw.crm || []).filter(
    (r) => r.annee === 2026 && r.granularite === 'Performance NL',
  );
  ['janvier', 'février', 'mars', 'avril'].forEach((m) => {
    const r = rows.find((x) => monthOfIso(x.mois) === m);
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

export const CRM_LANGUE = (raw.crm || [])
  .filter((r) => r.granularite === 'Langue (snapshot)')
  .map((r) => ({
    langue: r.langue,
    positionnes: r.positionnes,
    txOuv: r.txOuverture,
    txClic: r.txClic,
    txDesab: r.txDesab,
  }))
  .sort((a, b) => (b.positionnes ?? 0) - (a.positionnes ?? 0));

// -----------------------------------------------------------------------------
// BUDGET / COMMERCIAL
// -----------------------------------------------------------------------------

const LEVIER_COLORS = {
  SEO: '#22D3CC',
  SEA: '#0E9E96',
  Direct: '#7FE6E0',
  IA: '#FBBF24',
  RS: '#A78BFA',
  CRM: '#F472B6',
};

export const BUDGET_LEVIERS = (() => {
  const reel = (raw.budget || []).filter(
    (r) => r.categorie === 'Budget levier' && r.typePeriode === 'Réel',
  );
  const n1 = (raw.budget || []).filter(
    (r) => r.categorie === 'Budget levier' && r.typePeriode === 'N-1',
  );
  const totalReel = reel.reduce((s, r) => s + (r.montant ?? 0), 0) || 1;
  return reel
    .map((r) => ({
      levier: r.levier,
      budget: r.montant ?? 0,
      part: (r.montant ?? 0) / totalReel,
      n1: n1.find((x) => x.levier === r.levier)?.montant ?? 0,
      color: LEVIER_COLORS[r.levier] ?? '#888',
    }))
    .sort((a, b) => b.budget - a.budget);
})();

export const CA_PRODUITS = (() => {
  const rows = (raw.budget || []).filter(
    (r) => r.categorie === 'CA produit' && r.typePeriode === 'Réel',
  );
  const total = rows.reduce((s, r) => s + (r.montant ?? 0), 0) || 1;
  return rows
    .map((r) => ({
      produit: r.produit,
      ca: r.montant ?? 0,
      part: (r.montant ?? 0) / total,
    }))
    .sort((a, b) => b.ca - a.ca);
})();

export const CAMPINGS = (() => {
  const rows = (raw.budget || []).filter(
    (r) => r.categorie === 'Portefeuille campings',
  );
  const get = (metric, typePeriode = 'Réel') =>
    rows.find((r) => r.metrique === metric && r.typePeriode === typePeriode)?.volume ?? null;
  return {
    total: get('Total campings'),
    abonnement: get('Abonnement'),
    ppc: get('PPC total'),
    ppcAvecBudget: get('PPC actif'),
    ppcSansBudget: get('PPC sans budget'),
    n1: get('Abonnement', 'N-1'),
  };
})();

// -----------------------------------------------------------------------------
// Campagnes SEA en cours (FICTIF) — pour la page SEA
// -----------------------------------------------------------------------------

const TYPE_COLORS_SEA = {
  Brand: '#22D3CC',
  Generic: '#FBBF24',
  Concurrents: '#F87171',
  Display: '#A78BFA',
  Retargeting: '#F472B6',
};

export const SEA_CAMPAGNES = [
  { id: 'sea-1',  nom: 'Brand FR — CampingDirect',     pays: 'France',    type: 'Brand',       statut: 'Active', budgetMensuel: 8500, depense: 8120, impressions: 285000,  clics: 31500, conversions: 142 },
  { id: 'sea-2',  nom: 'Generic FR — Camping Mer',     pays: 'France',    type: 'Generic',     statut: 'Active', budgetMensuel: 6500, depense: 6210, impressions: 410000,  clics: 28200, conversions: 105 },
  { id: 'sea-3',  nom: 'Generic FR — Camping Famille', pays: 'France',    type: 'Generic',     statut: 'Active', budgetMensuel: 5200, depense: 4890, impressions: 320000,  clics: 19800, conversions:  78 },
  { id: 'sea-4',  nom: 'Concurrents FR',               pays: 'France',    type: 'Concurrents', statut: 'Active', budgetMensuel: 3200, depense: 2950, impressions:  95000,  clics:  9800, conversions:  32 },
  { id: 'sea-5',  nom: 'Display FR — Pré-saison',      pays: 'France',    type: 'Display',     statut: 'Active', budgetMensuel: 2400, depense: 2180, impressions: 1200000, clics:  8600, conversions:  18 },
  { id: 'sea-6',  nom: 'Retargeting FR',               pays: 'France',    type: 'Retargeting', statut: 'Active', budgetMensuel: 1800, depense: 1620, impressions: 145000,  clics: 12500, conversions:  65 },
  { id: 'sea-7',  nom: 'Brand DE',                     pays: 'Allemagne', type: 'Brand',       statut: 'Active', budgetMensuel:  920, depense:  760, impressions:  32000,  clics:  4100, conversions:  28 },
  { id: 'sea-8',  nom: 'Generic DE — Camping',         pays: 'Allemagne', type: 'Generic',     statut: 'Active', budgetMensuel: 1500, depense:  920, impressions:  78000,  clics:  5300, conversions:  22 },
  { id: 'sea-9',  nom: 'Brand NL',                     pays: 'Pays-Bas',  type: 'Brand',       statut: 'Active', budgetMensuel:  850, depense:  720, impressions:  28500,  clics:  3800, conversions:  18 },
  { id: 'sea-10', nom: 'Generic NL — Kamperen',        pays: 'Pays-Bas',  type: 'Generic',     statut: 'Active', budgetMensuel: 1200, depense: 1080, impressions:  95000,  clics:  4500, conversions:  24 },
  { id: 'sea-11', nom: 'Brand IT',                     pays: 'Italie',    type: 'Brand',       statut: 'Active', budgetMensuel:  480, depense:  320, impressions:  18000,  clics:  2200, conversions:  12 },
  { id: 'sea-12', nom: 'Generic ES — Camping',         pays: 'Espagne',   type: 'Generic',     statut: 'Pause',  budgetMensuel:    0, depense:    0, impressions:      0,  clics:     0, conversions:   0 },
  { id: 'sea-13', nom: 'Brand BE',                     pays: 'Belgique',  type: 'Brand',       statut: 'Active', budgetMensuel:  720, depense:  580, impressions:  22000,  clics:  2800, conversions:  15 },
  { id: 'sea-14', nom: 'Brand AT',                     pays: 'Autriche',  type: 'Brand',       statut: 'Active', budgetMensuel:  380, depense:  285, impressions:  14500,  clics:  1850, conversions:   9 },
];

export const SEA_TYPE_COLORS = TYPE_COLORS_SEA;

// -----------------------------------------------------------------------------
// Campagnes CRM 2026 (FICTIF)
// À terme : à externaliser dans une base Notion dédiée pour synchronisation.
// Une campagne = 1 jour. Toutes en canal Email. Les campagnes passées portent
// un objet `resultats` avec les KPIs de performance.
// -----------------------------------------------------------------------------

export const CRM_CAMPAGNES = [
  // ─── Passées (avec résultats fictifs) ─────────────────────────────────────
  {
    id: 'voeux-26', nom: 'Vœux 2026', type: 'NL', date: '2026-01-05',
    audience: '27 k contacts FR/DE/NL/IT/ES',
    objectif: 'Engagement / réactivation post-fêtes',
    color: '#22D3CC',
    resultats: {
      envois: 27000, delivres: 26109, txDelivrabilite: 0.967,
      ouvertures: 5483, txOuverture: 0.210,
      clics: 1305, txClic: 0.050,
      desabos: 130, txDesab: 0.005,
      conversions: 47,
      parLangue: [
        { langue: 'FR', envoi: 18180, txOuv: 0.183, txClic: 0.041 },
        { langue: 'DE', envoi: 3470,  txOuv: 0.305, txClic: 0.082 },
        { langue: 'NL', envoi: 2211,  txOuv: 0.268, txClic: 0.012 },
        { langue: 'IT', envoi: 1046,  txOuv: 0.193, txClic: 0.052 },
        { langue: 'ES', envoi: 1298,  txOuv: 0.092, txClic: 0.005 },
      ],
    },
  },
  {
    id: 'promo-hiver', nom: 'Promo Hiver', type: 'Promo', date: '2026-01-21',
    audience: 'FR/DE — 22 k',
    objectif: '−15 % sur séjours février',
    color: '#A78BFA',
    resultats: {
      envois: 22000, delivres: 21340, txDelivrabilite: 0.970,
      ouvertures: 5121, txOuverture: 0.240,
      clics: 1493, txClic: 0.070,
      desabos: 96, txDesab: 0.004,
      conversions: 64,
      parLangue: [
        { langue: 'FR', envoi: 18180, txOuv: 0.215, txClic: 0.058 },
        { langue: 'DE', envoi: 3470,  txOuv: 0.355, txClic: 0.122 },
      ],
    },
  },
  {
    id: 'st-valentin', nom: 'Saint-Valentin', type: 'NL', date: '2026-02-12',
    audience: 'Couples sans enfants — 8 k',
    objectif: 'Promotion séjours romantiques',
    color: '#F472B6',
    resultats: {
      envois: 8200, delivres: 7954, txDelivrabilite: 0.970,
      ouvertures: 2068, txOuverture: 0.260,
      clics: 636, txClic: 0.080,
      desabos: 32, txDesab: 0.004,
      conversions: 38,
      parLangue: [
        { langue: 'FR', envoi: 5400, txOuv: 0.245, txClic: 0.072 },
        { langue: 'DE', envoi: 1500, txOuv: 0.330, txClic: 0.118 },
        { langue: 'NL', envoi: 800,  txOuv: 0.282, txClic: 0.038 },
        { langue: 'IT', envoi: 500,  txOuv: 0.220, txClic: 0.085 },
      ],
    },
  },
  {
    id: 'vacances-fev', nom: 'Vacances scolaires', type: 'NL', date: '2026-02-18',
    audience: 'Familles FR — 14 k',
    objectif: 'Pousser séjours montagne / hiver',
    color: '#FBBF24',
    resultats: {
      envois: 14200, delivres: 13760, txDelivrabilite: 0.969,
      ouvertures: 2614, txOuverture: 0.190,
      clics: 550, txClic: 0.040,
      desabos: 65, txDesab: 0.005,
      conversions: 21,
      parLangue: [
        { langue: 'FR', envoi: 14200, txOuv: 0.190, txClic: 0.040 },
      ],
    },
  },
  {
    id: 'printemps', nom: 'Printemps Précoce', type: 'NL', date: '2026-03-09',
    audience: '32 k toutes langues',
    objectif: 'Démarrer trafic résa avant Pâques',
    color: '#22D3CC',
    resultats: {
      envois: 32000, delivres: 30950, txDelivrabilite: 0.967,
      ouvertures: 6809, txOuverture: 0.220,
      clics: 1547, txClic: 0.050,
      desabos: 124, txDesab: 0.004,
      conversions: 58,
      parLangue: [
        { langue: 'FR', envoi: 21000, txOuv: 0.205, txClic: 0.045 },
        { langue: 'DE', envoi: 4200,  txOuv: 0.298, txClic: 0.082 },
        { langue: 'NL', envoi: 2700,  txOuv: 0.255, txClic: 0.011 },
        { langue: 'IT', envoi: 1500,  txOuv: 0.185, txClic: 0.052 },
        { langue: 'ES', envoi: 1700,  txOuv: 0.088, txClic: 0.005 },
        { langue: 'EN', envoi: 900,   txOuv: 0.118, txClic: 0.020 },
      ],
    },
  },
  {
    id: 'paques-teaser', nom: 'Pâques Teaser', type: 'NL', date: '2026-03-23',
    audience: 'Familles avec enfants — 25 k',
    objectif: 'Pré-réservation Pâques',
    color: '#FBBF24',
    resultats: {
      envois: 25000, delivres: 24175, txDelivrabilite: 0.967,
      ouvertures: 5802, txOuverture: 0.240,
      clics: 1692, txClic: 0.070,
      desabos: 84, txDesab: 0.003,
      conversions: 89,
      parLangue: [
        { langue: 'FR', envoi: 16500, txOuv: 0.225, txClic: 0.062 },
        { langue: 'DE', envoi: 3300,  txOuv: 0.318, txClic: 0.105 },
        { langue: 'NL', envoi: 2100,  txOuv: 0.272, txClic: 0.018 },
        { langue: 'IT', envoi: 1100,  txOuv: 0.205, txClic: 0.078 },
        { langue: 'ES', envoi: 2000,  txOuv: 0.095, txClic: 0.008 },
      ],
    },
  },
  {
    id: 'paques-active', nom: 'Pâques Active', type: 'Évent', date: '2026-04-05',
    audience: 'Toute base — 38 k',
    objectif: 'Pic réservations Pâques',
    color: '#FBBF24',
    resultats: {
      envois: 38000, delivres: 36784, txDelivrabilite: 0.968,
      ouvertures: 10300, txOuverture: 0.280,
      clics: 3310, txClic: 0.090,
      desabos: 110, txDesab: 0.003,
      conversions: 142,
      parLangue: [
        { langue: 'FR', envoi: 25000, txOuv: 0.265, txClic: 0.080 },
        { langue: 'DE', envoi: 5000,  txOuv: 0.358, txClic: 0.135 },
        { langue: 'NL', envoi: 3200,  txOuv: 0.305, txClic: 0.022 },
        { langue: 'IT', envoi: 1800,  txOuv: 0.245, txClic: 0.098 },
        { langue: 'ES', envoi: 2000,  txOuv: 0.108, txClic: 0.012 },
        { langue: 'EN', envoi: 1000,  txOuv: 0.135, txClic: 0.025 },
      ],
    },
  },
  {
    id: 'lancement-ete', nom: 'Lancement Été', type: 'Évent', date: '2026-04-22',
    audience: 'Toute base — 42 k',
    objectif: 'Démarrer haute saison',
    color: '#22D3CC',
    resultats: {
      envois: 42000, delivres: 41160, txDelivrabilite: 0.980,
      ouvertures: 10290, txOuverture: 0.250,
      clics: 2470, txClic: 0.060,
      desabos: 168, txDesab: 0.004,
      conversions: 95,
      parLangue: [
        { langue: 'FR', envoi: 27500, txOuv: 0.235, txClic: 0.052 },
        { langue: 'DE', envoi: 5500,  txOuv: 0.328, txClic: 0.092 },
        { langue: 'NL', envoi: 3500,  txOuv: 0.288, txClic: 0.016 },
        { langue: 'IT', envoi: 2200,  txOuv: 0.215, txClic: 0.062 },
        { langue: 'ES', envoi: 2300,  txOuv: 0.105, txClic: 0.008 },
        { langue: 'EN', envoi: 1000,  txOuv: 0.125, txClic: 0.018 },
      ],
    },
  },
  {
    id: 'pont-mai', nom: 'Pont du 1er Mai', type: 'Promo', date: '2026-04-30',
    audience: 'Tous — 45 k',
    objectif: 'Court séjour 4 nuits',
    color: '#A78BFA',
    resultats: {
      envois: 45000, delivres: 44100, txDelivrabilite: 0.980,
      ouvertures: 10143, txOuverture: 0.230,
      clics: 2646, txClic: 0.060,
      desabos: 158, txDesab: 0.004,
      conversions: 78,
      parLangue: [
        { langue: 'FR', envoi: 29500, txOuv: 0.218, txClic: 0.055 },
        { langue: 'DE', envoi: 5800,  txOuv: 0.305, txClic: 0.088 },
        { langue: 'NL', envoi: 3700,  txOuv: 0.265, txClic: 0.012 },
        { langue: 'IT', envoi: 2400,  txOuv: 0.198, txClic: 0.058 },
        { langue: 'ES', envoi: 2500,  txOuv: 0.098, txClic: 0.006 },
        { langue: 'EN', envoi: 1100,  txOuv: 0.115, txClic: 0.018 },
      ],
    },
  },

  // ─── À venir (sans résultats) ─────────────────────────────────────────────
  { id: 'pentecote',        nom: 'Pentecôte',              type: 'NL',    date: '2026-05-19', audience: 'Tous — 47 k',         objectif: 'Court séjour weekend prolongé',        color: '#A78BFA' },
  { id: 'pre-saison',       nom: 'Pré-saison Été',         type: 'NL',    date: '2026-06-08', audience: '50 k',                objectif: 'Last call avant juillet',              color: '#FBBF24' },
  { id: 'last-min-juillet', nom: 'Last Minute Juillet',    type: 'Promo', date: '2026-06-25', audience: 'Tous — 51 k',         objectif: 'Remplir disponibilités juillet',       color: '#F87171' },
  { id: 'ete-haute',        nom: 'Été Haute Saison',       type: 'Évent', date: '2026-07-15', audience: 'Tous',                 objectif: 'Maintenir engagement vacanciers',      color: '#FBBF24' },
  { id: 'aout-vacances',    nom: 'Vacances Aoûtiens',      type: 'Évent', date: '2026-08-15', audience: 'Tous',                 objectif: 'Continuer momentum + promos',          color: '#FBBF24' },
  { id: 'rentree-promo',    nom: 'Rentrée + Last Minute',  type: 'Promo', date: '2026-09-10', audience: 'Sans enfants — 18 k', objectif: 'Combler fin de saison',                color: '#F87171' },
  { id: 'toussaint',        nom: 'Toussaint',              type: 'NL',    date: '2026-10-22', audience: 'Familles — 22 k',     objectif: 'Court séjour automne',                 color: '#A78BFA' },
  { id: 'saison-27-teaser', nom: 'Saison 2027 — Teaser',   type: 'NL',    date: '2026-11-10', audience: 'Tous — 52 k',         objectif: 'Annoncer ouverture pré-réservations',  color: '#22D3CC' },
  { id: 'fin-saison',       nom: 'Fin de Saison',          type: 'NL',    date: '2026-11-25', audience: 'Tous — 52 k',         objectif: 'Bilan + remerciement',                 color: '#7FE6E0' },
  { id: 'voeux-27',         nom: 'Vœux + Early Bird 2027', type: 'NL',    date: '2026-12-17', audience: '52 k',                objectif: 'Pré-résa 2027 −10 %',                  color: '#22D3CC' },
];

// -----------------------------------------------------------------------------
// Listing clients (FICTIF) — 100 clients générés de manière déterministe.
// À terme : à externaliser dans une base Notion "Clients" pour synchronisation.
// -----------------------------------------------------------------------------

const CLIENT_NOMS = [
  'Camping de la Plage', 'Camping des Pins', 'Camping Le Lac', 'Domaine du Soleil',
  'Camping Mer Azur', 'La Forêt Verte', 'Le Vieux Moulin', 'Camping Olivier',
  'Domaine des Vignes', 'Castel Royal', 'Les Mimosas', 'Camping L\'Étoile',
  'Roses de Provence', 'Cigales du Sud', 'Camping Vagues Bleues', 'La Calanque',
  'Camping du Rivage', 'Source Pure', 'Oasis Bleue', 'Le Bois Joli',
  'Domaine Castelnau', 'Côte Sauvage', 'Bourg Médiéval', 'Ranch des Cévennes',
  'Pino Solitario', 'Mare Cristallina', 'Sole Mio', 'Faro Antico',
  'Casa Nova', 'Villa Bella', 'La Gaviota', 'Mar y Sol',
  'Mediterraneo', 'Las Dunas', 'Costa Verde', 'Camping du Pré',
  'Domaine des Chênes', 'Camping Source', 'La Roseraie', 'Camping du Bourg',
  'Le Verger Fleuri', 'Camping Belle Étoile', 'Domaine de la Mer', 'Camping Atlantique',
  'Les Chalets du Lac', 'Camping Émeraude', 'Le Refuge Vert', 'Camping du Phare',
  'Domaine d\'Olonne', 'Camping Royal',
];

const CLIENT_LIEUX = [
  'Argelès', 'Biscarrosse', 'Hourtin', 'Cap Ferret', 'Saint-Tropez', 'Antibes',
  'Cassis', 'La Rochelle', 'Royan', 'Vendée', 'Quiberon', 'Carnac',
  'Bénodet', 'Saint-Malo', 'Trouville', 'Le Touquet', 'Toulon', 'Hyères',
  'Fréjus', 'Bandol', 'Bordeaux', 'Nîmes', 'Avignon', 'Aix',
  'Perpignan', 'Sète', 'Montpellier', 'Béziers', 'Narbonne', 'Cannes',
  'Costa Brava', 'Toscana', 'Sardaigne', 'Corse', 'Camargue', 'Lubéron',
];

const CLIENT_PAYS = ['FR', 'FR', 'FR', 'FR', 'FR', 'FR', 'FR', 'IT', 'ES', 'BE', 'NL'];
const CLIENT_PORTAILS = ['CD', 'CD', 'CD', 'CD', 'UC', 'C2B', 'IB', 'AC', 'CSV'];

export const CLIENTS = (() => {
  const out = [];
  for (let i = 0; i < 100; i++) {
    // Pseudo-aléatoire déterministe basé sur l'indice
    const r = (n) => (i * 9301 + 49297 + n * 233280) % 233280 / 233280;

    const isAB = r(1) < 0.78; // ~78 % en abonnement
    const pays = CLIENT_PAYS[Math.floor(r(2) * CLIENT_PAYS.length)];
    const portail = CLIENT_PORTAILS[Math.floor(r(3) * CLIENT_PORTAILS.length)];
    const nomBase = CLIENT_NOMS[i % CLIENT_NOMS.length];
    const lieu = CLIENT_LIEUX[(i * 7) % CLIENT_LIEUX.length];

    // Trafic mensuel moyen — distribution log-normale grossière
    const trafic = Math.round(80 + r(4) ** 2 * 4500);
    const txConv = 0.18 + r(5) * 0.50; // 18 à 68 %
    const clickouts = Math.round(trafic * txConv);
    const resa = Math.round(clickouts * (0.003 + r(6) * 0.012));

    let budgetMensuel = null;
    let budgetRestant = null;
    let pctConsomme = null;
    let statut;
    if (isAB) {
      statut = 'Actif';
    } else {
      budgetMensuel = Math.round((200 + r(7) * 1800) / 10) * 10;
      pctConsomme = r(8) * 1.15; // jusqu'à 115 %
      const restantBrut = budgetMensuel * (1 - Math.min(pctConsomme, 1));
      budgetRestant = Math.max(0, Math.round(restantBrut / 10) * 10);
      statut = pctConsomme >= 1 ? 'Sans budget' : 'Actif';
    }

    out.push({
      id: `c-${String(i + 1).padStart(3, '0')}`,
      nom: `${nomBase} — ${lieu}`,
      pays,
      portail,
      type: isAB ? 'AB' : 'PPC',
      statut,
      trafic,
      clickouts,
      txConv,
      resa,
      budgetMensuel,
      budgetRestant,
      pctConsomme,
    });
  }
  return out;
})();

// -----------------------------------------------------------------------------
// Méta — date de dernière sync (pour affichage en footer)
// -----------------------------------------------------------------------------

export const SYNCED_AT = raw.syncedAt || null;
