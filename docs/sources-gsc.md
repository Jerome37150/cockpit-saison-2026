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

Calculés depuis les positions GSC (moyenne par query) sur la fenêtre temporelle de la requête (par défaut : 30 derniers jours, jusqu'à J-3).

| Champ | Définition GSC |
|---|---|
| `kw`        | Nombre de queries observées (≥ 1 impression) |
| `top3`      | Queries avec `position ≤ 3` |
| `top4_10`   | Queries avec `3 < position ≤ 10` |
| `page2`     | Queries avec `10 < position ≤ 20` |
| `nonClasse` | Queries avec `position > 20` |
| `volumeRech` | ⚠️ `null` — pas dispo via GSC. À alimenter via Semrush / SE Ranking si décidé. |

## Schéma

1 ligne par (marché × portail). `SEO_MARCHES` (aggregator) somme par marché pour la UI.

```jsonc
{
  "syncedAt": "2026-05-07T08:00:00Z",
  "_about": "Google Search Console — généré par scripts/sync-gsc.mjs",

  "perMarketPerPortail": [
    {
      "marche": "FR",                 // FR | EN | NL | IT | DE | ES
      "portail": "CD",                // CD | C2B | CSV | IB | AC | UC
      "snapshotDate": "2026-04-30",
      "kw": 4042,
      "volumeRech": null,             // ⚠️ pas dans GSC
      "top3": 646,
      "top4_10": 1375,
      "page2": 306,
      "nonClasse": 1717
    }
  ]
}
```

## Mapping marché × portail → siteUrl GSC

Versionné dans [`scripts/gsc-sites.mjs`](../scripts/gsc-sites.mjs). MyCamping (MC)
exclu volontairement côté GSC (pas de propriété accessible avec le compte
Propriétaire `antigny37@gmail.com`).

## Sync — variables d'environnement

Auth **OAuth utilisateur** (et non service account : l'ajout d'un SA sur le projet
`ctv-kpi` est rejeté par GSC avec "adresse mail introuvable", quel que soit le SA
créé — issue Google côté propagation/identité).

```dotenv
GSC_OAUTH_CLIENT_ID=<client id desktop app, projet ctv-kpi>
GSC_OAUTH_CLIENT_SECRET=<secret>
GSC_OAUTH_REFRESH_TOKEN=<obtenu via scripts/gsc-oauth.mjs>
GSC_SITES=FR:https://www.campingdirect.com/,DE:https://...,...
```

### Procédure init (one-shot)

1. **GCP Console → APIs & Services → Credentials** (projet `ctv-kpi`)
   → **Créer des identifiants → ID client OAuth** → type **Application de bureau**
   → noter le Client ID + Client Secret.
2. **APIs & Services → OAuth consent screen** → **Publier l'application** (passer de
   Testing à Production). Pas de vérification Google nécessaire pour le scope
   `webmasters.readonly` à usage personnel.
3. Renseigner `GSC_OAUTH_CLIENT_ID` + `GSC_OAUTH_CLIENT_SECRET` dans `.env`.
4. `node scripts/gsc-oauth.mjs` → consentement dans le navigateur avec le compte
   Propriétaire des propriétés GSC → copier le `GSC_OAUTH_REFRESH_TOKEN` affiché
   dans `.env`.
5. `node scripts/gsc-list-sites.mjs` → vérifier la liste des propriétés visibles
   et alimenter `GSC_SITES`.

⚠️ Si l'app OAuth reste en mode **Testing**, le refresh_token expire au bout
de **7 jours** — d'où l'étape 2 obligatoire.

## Cadence

1× / mois (les positions évoluent lentement, snapshot mensuel suffit pour le cockpit).
