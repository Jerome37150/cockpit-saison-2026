# Source — Google Search Console

**Fichier produit** : [`src/data/sources/gsc.json`](../src/data/sources/gsc.json)
**Schéma**         : [`src/data/shared/schemas.js`](../src/data/shared/schemas.js) → `gscSchema`
**Sync**           : [`scripts/sync-gsc.mjs`](../scripts/sync-gsc.mjs) (à brancher au go-live)
**Aggregator consommateur** : `seo` (uniquement `SEO_MARCHES`)

## Périmètre

GSC sert **uniquement** au panneau "SEO_MARCHES" (snapshot des positions par marché). Le trafic SEO et les clickouts viennent de Piano (voir [`sources-piano.md`](./sources-piano.md)).

## Limites GSC à connaître

- Top 1 000 queries par requête (échantillonnage au-delà).
- `position` est une **moyenne pondérée par impression**, pas un suivi positionnel quotidien.
- **Pas de volume de recherche** dans GSC. Le champ `volumeRech` reste `null` tant qu'aucun outil tiers (Semrush, Ahrefs, SE Ranking) n'est branché.
- Concept "mot-clé tracké" différent d'un tracker positionnel : GSC = top queries observées, pas une liste figée suivie au quotidien.

## Sémantique des buckets `top3` / `top4_10` / `page2` / `nonClasse`

Calculés depuis les positions GSC (moyenne par query) sur la fenêtre temporelle de la requête (par défaut : 30 derniers jours).

| Champ | Définition GSC |
|---|---|
| `kw`        | Nombre de queries observées (≥ 1 impression) |
| `top3`      | Queries avec `position ≤ 3` |
| `top4_10`   | Queries avec `3 < position ≤ 10` |
| `page2`     | Queries avec `10 < position ≤ 20` |
| `nonClasse` | Queries avec `position > 20` |
| `volumeRech` | ⚠️ `null` — pas dispo via GSC. À alimenter via Semrush / SE Ranking si décidé. |

## Schéma

```jsonc
{
  "syncedAt": "2026-05-07T08:00:00Z",
  "_about": "Google Search Console — généré par scripts/sync-gsc.mjs",

  // Snapshot par marché (1 row = 1 marché × 1 date snapshot)
  "perMarket": [
    {
      "marche": "FR",                 // FR | EN | NL | IT | DE | ES
      "snapshotDate": "2026-04-30",   // date du snapshot
      "kw": 12126,
      "volumeRech": null,             // ⚠️ pas dans GSC
      "top3": 1938,
      "top4_10": 4123,
      "page2": 918,
      "nonClasse": 5147
    }
  ]
}
```

## Sync — variables d'environnement

```dotenv
GSC_SERVICE_ACCOUNT_JSON=<contenu JSON ou chemin>
GSC_SITES=FR:https://www.campingdirect.com/,DE:https://...,...
```

## Cadence

1× / mois (les positions évoluent lentement, snapshot mensuel suffit pour le cockpit).
