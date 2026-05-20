// =============================================================================
// Méta — date de dernière sync (pour affichage en footer).
//
// Chaque source a sa propre cadence de sync. SYNCED_AT renvoie le timestamp
// le plus récent de toutes les sources. SYNCED_AT_BY_SOURCE expose le détail.
// =============================================================================

import piano from '../sources/piano.json';
import gsc from '../sources/gsc.json';
import secureholiday from '../sources/secureholiday.json';

const sources = { piano, gsc, secureholiday };

export const SYNCED_AT_BY_SOURCE = Object.fromEntries(
  Object.entries(sources).map(([k, v]) => [k, v.syncedAt ?? null]),
);

export const SYNCED_AT = (() => {
  const dates = Object.values(SYNCED_AT_BY_SOURCE).filter(Boolean);
  if (dates.length === 0) return null;
  return dates.sort().slice(-1)[0]; // ISO strings → tri lexicographique = chronologique
})();
