// =============================================================================
// Schémas Zod pour valider chaque source au chargement des aggregators.
// Toute dérive de format côté sync (Piano / GSC / Secure Holiday) fait échouer
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
// Secure Holiday — agrégat depuis les XLSX de monitoring.secureholiday.net
// -----------------------------------------------------------------------------

export const secureholidaySchema = z.object({
  ...meta,
  perMonth: z.array(z.object({
    annee: z.number().int(),
    mois: isoMois,
    typeReservation: z.string(),   // "Directe" (Pack Trafic) | "Apporteur" (Pack Trafic Apporteurs)
    ca: optionalNumber,
    volumeResa: optionalNumber,
    ticketMoyen: optionalNumber,
  })),
  perMonthByMarket: z.array(z.object({
    mois: isoMois,
    country: z.string(),
    ca: optionalNumber,
    volumeResa: optionalNumber,
  })),
  perEstablishment: z.array(z.object({
    establishmentId: z.number(),
    establishmentName: z.string(),
    country: z.string(),
    region: z.string(),
    department: z.string(),
    ca: optionalNumber,
    volumeResa: optionalNumber,
  })),
  statsClicks: z.object({
    coversFile: z.string().nullable(),
    perEngine: z.array(z.object({
      engineId: z.number(),
      engineName: z.string(),
      shCount: optionalNumber,
      shCountEuro: optionalNumber,
      clickouts: optionalNumber,
      clickoutsDedup: optionalNumber,
      clicksMin: optionalNumber,
      clicksMoyen: optionalNumber,
      clicksMedian: optionalNumber,
      clicksMax: optionalNumber,
      budget: optionalNumber,
    })),
  }),
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
