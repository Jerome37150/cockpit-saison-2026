/**
 * write-json-source.mjs
 * ----------------------------------------------------------------------------
 * Helper partagé par sync-piano / sync-gsc / aggregate-secureholiday.
 *
 * Écrit un JSON source en distinguant deux timestamps :
 *   - syncedAt        : dernière exécution du script (toujours = maintenant)
 *   - dataChangedAt   : dernier moment où le CONTENU a réellement changé
 *                       (hash stable du payload, hors syncedAt/dataChangedAt).
 *
 * Si le contenu est identique au fichier existant, dataChangedAt est conservé.
 * Permet à la UI d'afficher la fraîcheur réelle des données plutôt que l'heure
 * d'exécution du script (utile quand un sync re-aggrège sans nouvelles données).
 * ============================================================================
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';

// Sérialisation déterministe : clés triées récursivement.
// JSON.stringify standard ne garantit pas l'ordre des clés → un même contenu
// pourrait produire des hashes différents selon l'ordre d'insertion.
const stableStringify = (v) => {
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  if (v && typeof v === 'object') {
    return '{' + Object.keys(v).sort().map((k) =>
      JSON.stringify(k) + ':' + stableStringify(v[k])
    ).join(',') + '}';
  }
  return JSON.stringify(v);
};

const contentHash = ({ syncedAt: _s, dataChangedAt: _d, ...rest }) =>
  createHash('sha256').update(stableStringify(rest)).digest('hex');

/**
 * @param {string} path - chemin absolu du JSON à écrire
 * @param {object} payload - contenu (sans syncedAt/dataChangedAt, ajoutés ici)
 * @returns {Promise<{dataChangedAt: string, changed: boolean}>}
 */
export async function writeJsonSource(path, payload) {
  const now = new Date().toISOString();
  let dataChangedAt = now;
  let changed = true;

  try {
    const prev = JSON.parse(await readFile(path, 'utf8'));
    const prevDataChangedAt = prev.dataChangedAt ?? prev.syncedAt ?? null;
    if (prevDataChangedAt && contentHash(prev) === contentHash(payload)) {
      dataChangedAt = prevDataChangedAt;
      changed = false;
    }
  } catch (_) {
    // Fichier inexistant ou invalide → dataChangedAt = maintenant (création).
  }

  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    JSON.stringify({ syncedAt: now, dataChangedAt, ...payload }, null, 2) + '\n',
  );

  return { dataChangedAt, changed };
}
