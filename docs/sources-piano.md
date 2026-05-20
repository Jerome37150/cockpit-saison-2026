# Source — Piano Analytics

**Fichier produit** : [`src/data/sources/piano.json`](../src/data/sources/piano.json)
**Schéma**         : [`src/data/shared/schemas.js`](../src/data/shared/schemas.js) → `pianoSchema`
**Sync**           : [`scripts/sync-piano.mjs`](../scripts/sync-piano.mjs) (à brancher au go-live)
**Aggregators consommateurs** : `portails`, `global`, `canaux`, `seo`, `sea`

## Périmètre

Piano Analytics fournit le trafic web et les conversions. C'est la source canonique pour :

- Trafic + clickouts par portail (PORTAILS, GLOBAL)
- Trafic par canal d'acquisition (CANAUX)
- Trafic SEO (organique) agrégé et par portail (SEO_PERF, SEO_PER_PORTAIL)
- Trafic SEA (paid) + clickouts SEA par pays (SEA_PERF, SEA_PAYS)

Piano **ne fournit pas** : budget Google Ads, deliverability email. Les données business (résa, CA, portefeuille campings) viennent de Secure Holiday (`secureholiday.json`).

## Hypothèses techniques à confirmer côté ctoutvert

| Hypothèse | Impact si non vérifiée |
|---|---|
| L'événement custom `clickout` est tagué sur tous les 7 portails | Toute la colonne `clickouts` du cockpit reste vide |
| Le canal "IA Générative" est configuré (règle de bucketing referrers : `chatgpt.com`, `perplexity.ai`, `claude.ai`, `gemini.google.com`, etc.) | `CANAUX[m].IA` reste à 0 |
| Granularité Piano : 1 property par portail OU 1 property + dimension `site` | Détermine la stratégie de query du sync script |

## Schéma

```jsonc
{
  "syncedAt": "2026-05-07T08:00:00Z",
  "_about": "Piano Analytics — généré par scripts/sync-piano.mjs",

  // Trafic + clickouts par portail × mois × type
  "perPortail": [
    {
      "annee": 2026,
      "mois": "2026-01-01",          // 1er du mois (ISO YYYY-MM-DD)
      "portail": "CD",                // code court : CD, C2B, CSV, IB, AC, UC, MC
      "type": "Réel",                 // "Réel" | "N-1" | "Objectif"
      "trafic": 274787,               // sessions Piano (m_visits)
      "clickouts": 185352,            // custom event clickout (m_events_count_clickout)
      "origine": "Fictif"             // optionnel — marque les portails non encore tagués
    }
  ],

  // Trafic par canal d'acquisition
  "byChannel": [
    {
      "annee": 2026,
      "mois": "2026-01-01",
      "canal": "SEO",                 // SEO | SEA | Direct | Referral | Social Media | IA Générative | CRM
      "typePeriode": "Réel",          // "Réel" | "N-1"
      "trafic": 141262
    }
  ],

  // SEO mensuel agrégé (channel=organic, tous portails confondus)
  "seoMonthly": [
    {
      "annee": 2026,
      "mois": "2026-01-01",
      "typePeriode": "Réel",
      "origine": "Réel",
      "trafic": 143699,
      "clickouts": 78479
    }
  ],

  // SEO mensuel par portail
  "seoPerPortail": [
    {
      "annee": 2026,
      "mois": "2026-01-01",
      "portail": "CD",
      "typePeriode": "Réel",
      "origine": "Fictif",
      "trafic": 114959,
      "clickouts": 62783
    }
  ],

  // SEA — clickouts par pays (le budget par levier marketing n'est plus disponible)
  "seaByCountry": [
    {
      "annee": 2026,
      "mois": "2026-01-01",
      "pays": "France",
      "typePeriode": "Réel",          // "Réel" | "Prévi"
      "clickouts": 73287
    }
  ]
}
```

## Sync — variables d'environnement

```dotenv
PIANO_API_KEY=<clé Data API>
PIANO_API_SECRET=<secret>
PIANO_SITES=CD:1234567,C2B:7654321,CSV:...,IB:...,AC:...,UC:...,MC:...
```

## Cadence

À définir. Recommandation : 1× / jour la nuit (les volumes sont mensuels, pas besoin de plus).
