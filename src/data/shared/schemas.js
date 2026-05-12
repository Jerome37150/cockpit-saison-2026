// =============================================================================
// Schémas Zod pour valider chaque source au chargement des aggregators.
// Toute dérive de format côté sync (Piano / GSC / CSV Inaxel) fait échouer
// le build avec un message clair plutôt qu'un crash silencieux côté UI.
// =============================================================================

import { z } from 'zod';

const isoMois = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'mois doit être au format ISO YYYY-MM-DD');
const optionalNumber = z.number().nullable();
const meta = {
  syncedAt: z.string().nullable(),
  _about: z.string().optional(),
};

// -----------------------------------------------------------------------------
// Piano Analytics
// -----------------------------------------------------------------------------

export const pianoSchema = z.object({
  ...meta,
  perPortail: z.array(z.object({
    annee: z.number().int(),
    mois: isoMois,
    portail: z.string(),
    type: z.string(),         // "Réel" | "N-1" | "Objectif"
    trafic: optionalNumber,
    clickouts: optionalNumber,
    origine: z.string().optional(),
  })),
  byChannel: z.array(z.object({
    annee: z.number().int(),
    mois: isoMois,
    canal: z.string(),
    typePeriode: z.string(),
    trafic: optionalNumber,
  })),
  seoMonthly: z.array(z.object({
    annee: z.number().int(),
    mois: isoMois,
    typePeriode: z.string(),
    origine: z.string().nullable(),
    trafic: optionalNumber,
    clickouts: optionalNumber,
  })),
  seoPerPortail: z.array(z.object({
    annee: z.number().int(),
    mois: isoMois,
    portail: z.string(),
    typePeriode: z.string(),
    origine: z.string().nullable(),
    trafic: optionalNumber,
    clickouts: optionalNumber,
  })),
  seaByCountry: z.array(z.object({
    annee: z.number().int(),
    mois: isoMois,
    pays: z.string(),
    typePeriode: z.string(),
    clickouts: optionalNumber,
  })),
});

// -----------------------------------------------------------------------------
// Google Search Console
// -----------------------------------------------------------------------------

export const gscSchema = z.object({
  ...meta,
  perMarket: z.array(z.object({
    marche: z.string(),
    snapshotDate: isoMois,
    kw: optionalNumber,
    volumeRech: optionalNumber, // ⚠️ pas dispo via GSC nativement
    top3: optionalNumber,
    top4_10: optionalNumber,
    page2: optionalNumber,
    nonClasse: optionalNumber,
  })),
});

// -----------------------------------------------------------------------------
// Inaxel — Réservations & CA
// -----------------------------------------------------------------------------

export const reservationsSchema = z.object({
  ...meta,
  rows: z.array(z.object({
    annee: z.number().int(),
    mois: isoMois,
    typePeriode: z.string(),       // "Réel" | "N-1"
    typeReservation: z.string(),   // "Directe" | "Apporteur" | "Total"
    ca: optionalNumber,
    volumeResa: optionalNumber,
  })),
});

// -----------------------------------------------------------------------------
// Inaxel — SEA (Google Ads)
// -----------------------------------------------------------------------------

export const seaSchema = z.object({
  ...meta,
  budgetByCountry: z.array(z.object({
    annee: z.number().int(),
    mois: isoMois,
    pays: z.string(),
    typePeriode: z.string(),       // "Réel" | "Prévi"
    budget: optionalNumber,
  })),
  campagnes: z.array(z.object({
    id: z.string(),
    nom: z.string(),
    pays: z.string(),
    type: z.string(),              // Brand | Generic | Concurrents | Display | Retargeting
    statut: z.string(),            // Active | Pause
    budgetMensuel: z.number(),
    depense: z.number(),
    impressions: z.number(),
    clics: z.number(),
    conversions: z.number(),
  })),
});

// -----------------------------------------------------------------------------
// Inaxel — CRM (emailing)
// -----------------------------------------------------------------------------

const crmCampagneResultats = z.object({
  envois: z.number(),
  delivres: z.number(),
  txDelivrabilite: z.number(),
  ouvertures: z.number(),
  txOuverture: z.number(),
  clics: z.number(),
  txClic: z.number(),
  desabos: z.number(),
  txDesab: z.number(),
  conversions: z.number(),
  parLangue: z.array(z.object({
    langue: z.string(),
    envoi: z.number(),
    txOuv: z.number(),
    txClic: z.number(),
  })),
});

export const crmSchema = z.object({
  ...meta,
  base: z.array(z.object({
    annee: z.number().int(),
    mois: isoMois,
    totalContacts: optionalNumber,
    positionnes: optionalNumber,
    nouveaux: optionalNumber,
    desabos: optionalNumber,
    netGrowth: optionalNumber,
    txDesab: optionalNumber,
  })),
  newsletter: z.array(z.object({
    annee: z.number().int(),
    mois: isoMois,
    txDelivrabilite: optionalNumber,
    txOuverture: optionalNumber,
    txClic: optionalNumber,
    txDesab: optionalNumber,
    nouveaux: optionalNumber,
  })),
  langue: z.array(z.object({
    snapshotDate: isoMois,
    langue: z.string(),
    positionnes: optionalNumber,
    txOuverture: optionalNumber,
    txClic: optionalNumber,
    txDesab: optionalNumber,
  })),
  campagnes: z.array(z.object({
    id: z.string(),
    nom: z.string(),
    type: z.string(),
    date: isoMois,
    audience: z.string(),
    objectif: z.string(),
    color: z.string(),
    resultats: crmCampagneResultats.optional(), // absent pour les campagnes futures
  })),
});

// -----------------------------------------------------------------------------
// Inaxel — Budget & finances
// -----------------------------------------------------------------------------

export const budgetSchema = z.object({
  ...meta,
  leviers: z.array(z.object({
    annee: z.number().int(),
    levier: z.string(),
    typePeriode: z.string(),
    periode: z.string(),
    montant: optionalNumber,
  })),
  caProduits: z.array(z.object({
    annee: z.number().int(),
    produit: z.string(),
    typePeriode: z.string(),
    periode: z.string(),
    montant: optionalNumber,
  })),
  portefeuilleCampings: z.array(z.object({
    annee: z.number().int(),
    metrique: z.string(),
    typePeriode: z.string(),
    periode: z.string(),
    volume: optionalNumber,
  })),
});

// -----------------------------------------------------------------------------
// Inaxel — Liste clients
// -----------------------------------------------------------------------------

export const clientsSchema = z.object({
  ...meta,
  rows: z.array(z.object({
    id: z.string(),
    nom: z.string(),
    pays: z.string(),
    portail: z.string(),
    type: z.string(),              // "AB" | "PPC"
    statut: z.string(),            // "Actif" | "Sans budget"
    trafic: z.number(),
    clickouts: z.number(),
    txConv: z.number(),
    resa: z.number(),
    budgetMensuel: optionalNumber,
    budgetRestant: optionalNumber,
    pctConsomme: optionalNumber,
  })),
});

// -----------------------------------------------------------------------------
// Helper de validation : parse + message d'erreur explicite
// -----------------------------------------------------------------------------

export const validate = (schema, data, sourceName) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 5)
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `[cockpit/data] Schéma invalide pour la source "${sourceName}".\n${issues}`,
    );
  }
  return result.data;
};
