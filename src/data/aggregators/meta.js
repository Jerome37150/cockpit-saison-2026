// =============================================================================
// Méta — timestamps de fraîcheur des données.
//
// Distinction importante :
//   - syncedAt       : dernière exécution du script de sync (toujours "récent"
//                      si le sync tourne en nightly, même quand rien n'a changé).
//   - dataChangedAt  : dernier moment où le CONTENU a réellement changé (set
//                      par scripts/_lib/write-json-source.mjs via hash stable).
//
// La UI affiche `dataChangedAt` pour refléter la fraîcheur réelle des données.
// Fallback vers `syncedAt` si une source n'a pas encore `dataChangedAt`
// (compatibilité avec les anciennes versions des JSON).
// =============================================================================

import piano from '../sources/piano.json';
import gsc from '../sources/gsc.json';
import secureholiday from '../sources/secureholiday.json';

const sources = { piano, gsc, secureholiday };

// Conserve syncedAt pour debug / compat ; la UI utilisera dataChangedAt.
export const SYNCED_AT_BY_SOURCE = Object.fromEntries(
  Object.entries(sources).map(([k, v]) => [k, v.syncedAt ?? null]),
);

export const DATA_CHANGED_AT_BY_SOURCE = Object.fromEntries(
  Object.entries(sources).map(([k, v]) => [k, v.dataChangedAt ?? v.syncedAt ?? null]),
);

const maxIso = (obj) => {
  const dates = Object.values(obj).filter(Boolean);
  if (dates.length === 0) return null;
  return dates.sort().slice(-1)[0]; // ISO strings → tri lexicographique = chronologique
};

export const SYNCED_AT = maxIso(SYNCED_AT_BY_SOURCE);
export const DATA_CHANGED_AT = maxIso(DATA_CHANGED_AT_BY_SOURCE);
