# Cockpit Marketing — ctoutvert

Dashboard de pilotage consolidé de la saison 2026.

- **Vue d'ensemble · Portails · SEO · SEA · CRM · Performance · Analyse IA · Clients**
- Comparaisons mensuelles 2026 vs 2025
- Sélecteur de mois (Janvier → Avril + Cumul)

## Démarrage rapide

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # build de production
npm run preview      # preview du build
```

## Architecture data

```
src/data/
├── sources/                  Données brutes normalisées (1 fichier par origine)
│   ├── piano.json            ← scripts/sync-piano.mjs
│   ├── gsc.json              ← scripts/sync-gsc.mjs
│   └── secureholiday.json    ← scripts/aggregate-secureholiday.mjs (depuis data/raw/secureholiday/*.xlsx)
├── shared/
│   ├── constants.js          Mois, codes portails / canaux, palettes
│   ├── helpers.js            sumByMonth, safeDiv, sumDirAndApp, ...
│   └── schemas.js            Validation Zod par source (build échoue si dérive)
├── aggregators/              Un module par section UI
│   ├── global.js             GLOBAL · GLOBAL_N1 · GLOBAL_OBJ
│   ├── portails.js           PORTAILS · PORTAIL_ORIGINE
│   ├── canaux.js             CANAUX
│   ├── seo.js                SEO_PERF · SEO_MARCHES · SEO_PER_PORTAIL
│   ├── sea.js                SEA_PERF · SEA_PAYS · SEA_CAMPAGNES (= null)
│   ├── crm.js                tous = null (source non connectée)
│   ├── budget.js             tous = null (source non connectée)
│   ├── clients.js            CLIENTS = null (source non connectée)
│   └── meta.js               SYNCED_AT · SYNCED_AT_BY_SOURCE
└── index.js                  Façade : la UI importe tout depuis ici
```

La UI consomme uniquement la façade :
```js
import { GLOBAL, PORTAILS, SEO_PERF, ... } from './data';
```

## Comment les données arrivent

| Source | Mécanisme | Script | Doc |
|---|---|---|---|
| Piano Analytics | API Data Query | `npm run sync-piano` | [docs/sources-piano.md](docs/sources-piano.md) |
| Google Search Console | API Search Analytics | `npm run sync-gsc` | [docs/sources-gsc.md](docs/sources-gsc.md) |
| Secure Holiday | Playwright scraping → XLSX → JSON | `npm run sync-secureholiday` | — |

### Secure Holiday — pipeline détaillé

Le scrap tourne en **GitHub Actions chaque nuit à 05:00 UTC**
([.github/workflows/sync-secureholiday.yml](.github/workflows/sync-secureholiday.yml)) :

1. `sync-secureholiday.mjs` se connecte à `monitoring.secureholiday.net` (Playwright)
   et télécharge les 3 exports (Pack Trafic / Pack Trafic Apporteurs / Stats Clicks)
   pour J-1. Les XLSX bruts sont déposés dans `data/raw/secureholiday/{export}/{date}.xlsx`.
2. `aggregate-secureholiday.mjs` relit **tous** les XLSX (dédup par BookingId), agrège
   par mois × type de réservation / marché / établissement / engine, et produit
   `src/data/sources/secureholiday.json` consommé par la UI.
3. Le workflow commit + push automatiquement les nouveaux fichiers sur `main`.

Manuellement : `Actions → Sync Secure Holiday → Run workflow` avec des dates
arbitraires pour combler un trou.

## Statut des sources et pages

| Page | Sources | Statut |
|---|---|---|
| Vue d'ensemble | Piano + Secure Holiday | ✅ OK |
| Portails | Piano | ✅ OK |
| Portails → modal SEO/GEO | Piano + GSC | ✅ OK |
| SEA — KPI trafic / clickouts | Piano | ✅ OK |
| SEA — Budget consommé | — | ❌ Non connecté (sea.json supprimé) |
| SEA — Listing campagnes | — | ❌ Non connecté → `<DataUnavailable />` |
| CRM (toute la page) | — | ❌ Non connectée → `<DataUnavailable />` |
| Performance / ROI | — | ❌ Non connectée (manque budget par levier) |
| Analyse IA | — | ❌ Non connectée (dépend de CRM + Budget) |
| Clients (toute la page) | — | ❌ Non connectée |

Les panneaux marqués ❌ affichent un encadré `<DataUnavailable>` listant les
métriques manquantes — pas de données factices. Quand une source sera branchée,
il suffira d'écrire l'aggregator correspondant et de retirer le `null`.

## Validation

Chaque aggregator valide sa source via Zod ([`src/data/shared/schemas.js`](src/data/shared/schemas.js))
au chargement. Le build échoue avec un message explicite si une source ne
respecte pas son schéma — protège le dashboard contre les dérives silencieuses
côté sync.

## Stack technique

- **React 18** + **Vite 5**
- **Tailwind CSS 3**
- **Recharts** (graphiques)
- **Lucide React** (icônes)
- **Zod 4** (validation des sources)
- **Playwright** (scraping Secure Holiday)
- **xlsx** (lecture des exports)

## Déploiement

GitHub Pages : push sur `main` déclenche
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) qui build
et publie sur <https://jerome37150.github.io/cockpit-saison-2026/>.

Protection front : mot de passe en JS (cosmétique — le bundle JS contient
les données en clair). À renforcer si la confidentialité devient critique.
