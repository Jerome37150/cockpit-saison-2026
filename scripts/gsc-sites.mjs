/**
 * gsc-sites.mjs
 * ----------------------------------------------------------------------------
 * Config : mapping marché × portail → siteUrl GSC.
 *
 * Les URLs sont publiques (pas de secret) — versionnées plutôt que dans .env.
 * Étendre/modifier ici si un portail change de domaine ou si on ajoute un marché.
 *
 * Périmètre actuel :
 *   - Portails du cockpit : CD, C2B, CSV, IB, AC, UC (cf. PORTAIL_CODES)
 *   - MC (MyCamping) : pas de propriété GSC accessible → exclu volontairement
 *     côté GSC ; reste présent dans Piano.
 *   - Statut "siteUnverifiedUser" (sc-domain:*.camping2be.com) : non utilisable
 *     par l'API → on prend les variantes "https://..." en `siteOwner`.
 * ============================================================================
 */

export const GSC_SITES = [
  // Marché FR
  { marche: 'FR', portail: 'CD',  siteUrl: 'https://www.campingdirect.com/fr/' },
  { marche: 'FR', portail: 'C2B', siteUrl: 'https://www.camping2be.com/' },
  { marche: 'FR', portail: 'CSV', siteUrl: 'https://www.camping-streetview.com/' },

  // Marché EN
  { marche: 'EN', portail: 'CD',  siteUrl: 'https://www.campingdirect.com/en/' },
  { marche: 'EN', portail: 'C2B', siteUrl: 'https://en.camping2be.com/' },
  { marche: 'EN', portail: 'UC',  siteUrl: 'https://www.ucamping.com/' },

  // Marché NL
  { marche: 'NL', portail: 'CD',  siteUrl: 'https://www.campingdirect.com/nl/' },
  { marche: 'NL', portail: 'C2B', siteUrl: 'https://nl.camping2be.com/' },

  // Marché IT
  { marche: 'IT', portail: 'CD',  siteUrl: 'https://www.campingdirect.com/it/' },
  { marche: 'IT', portail: 'C2B', siteUrl: 'https://it.camping2be.com/' },
  { marche: 'IT', portail: 'CSV', siteUrl: 'https://it.camping-streetview.com/' },
  { marche: 'IT', portail: 'AC',  siteUrl: 'https://www.alcampeggio.it/' },

  // Marché DE
  { marche: 'DE', portail: 'CD',  siteUrl: 'https://www.campingdirect.com/de/' },
  { marche: 'DE', portail: 'C2B', siteUrl: 'https://de.camping2be.com/' },
  { marche: 'DE', portail: 'CSV', siteUrl: 'sc-domain:de.camping-streetview.com' },

  // Marché ES
  { marche: 'ES', portail: 'CD',  siteUrl: 'https://www.campingdirect.com/es/' },
  { marche: 'ES', portail: 'C2B', siteUrl: 'https://es.camping2be.com/' },
  { marche: 'ES', portail: 'CSV', siteUrl: 'https://es.camping-streetview.com/' },
  { marche: 'ES', portail: 'IB',  siteUrl: 'https://www.ibericamp.com/' },
];

// Ordre canonique des marchés pour les itérations / affichage.
export const MARCHES = ['FR', 'EN', 'NL', 'IT', 'DE', 'ES'];
