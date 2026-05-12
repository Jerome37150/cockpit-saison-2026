// =============================================================================
// BUDGET — répartition par levier, CA par produit, portefeuille campings.
//
// Source : Inaxel (`inaxel/budget.json`) — backoffice finances, déposé par
// l'agent IA.
// =============================================================================

import budget from '../sources/inaxel/budget.json';
import { LEVIER_COLORS } from '../shared/constants.js';
import { budgetSchema, validate } from '../shared/schemas.js';

const data = validate(budgetSchema, budget, 'inaxel/budget.json');

export const BUDGET_LEVIERS = (() => {
  const reel = data.leviers.filter((r) => r.typePeriode === 'Réel');
  const n1 = data.leviers.filter((r) => r.typePeriode === 'N-1');
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
  const rows = data.caProduits.filter((r) => r.typePeriode === 'Réel');
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
  const rows = data.portefeuilleCampings;
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
