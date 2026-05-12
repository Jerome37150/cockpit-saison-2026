# Cockpit Saison 2026 — ctoutvert

Dashboard de pilotage consolidé de la saison 2026.

- **Vue d'ensemble · Portails · SEO · SEA · CRM · Budget · Commercial**
- Comparaisons mensuelles 2026 vs 2025
- Sélecteur de mois (Janvier → Avril + Cumul)

## Démarrage rapide

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # build de production
npm run preview      # preview du build
```

## État du projet

Phase de **maquettes** : les données affichées sont fictives mais déjà au
format cible (Piano + GSC + CSV Inaxel). Les connexions aux vraies sources
seront branchées une fois les maquettes validées — la structure n'a pas
besoin de bouger.

## Architecture data

```
src/data/
├── sources/                  Données brutes normalisées (1 fichier par origine)
│   ├── piano.json            ← scripts/sync-piano.mjs
│   ├── gsc.json              ← scripts/sync-gsc.mjs
│   └── inaxel/               ← scripts/ingest-csv.mjs (CSV → JSON)
│       ├── reservations.json
│       ├── sea.json
│       ├── crm.json
│       ├── budget.json
│       └── clients.json
├── shared/
│   ├── constants.js          Mois, codes portails / canaux, palettes
│   ├── helpers.js            sumByMonth, safeDiv, sumDirAndApp, ...
│   └── schemas.js            Validation Zod par source (build échoue si dérive)
├── aggregators/              Un module par section UI
│   ├── global.js             GLOBAL · GLOBAL_N1 · GLOBAL_OBJ
│   ├── portails.js           PORTAILS · PORTAIL_ORIGINE
│   ├── canaux.js             CANAUX
│   ├── seo.js                SEO_PERF · SEO_MARCHES · SEO_PER_PORTAIL
│   ├── sea.js                SEA_PERF · SEA_PAYS · SEA_CAMPAGNES
│   ├── crm.js                CRM_BASE · CRM_NL · CRM_LANGUE · CRM_CAMPAGNES
│   ├── budget.js             BUDGET_LEVIERS · CA_PRODUITS · CAMPINGS
│   ├── clients.js            CLIENTS
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
| Outils internes Inaxel | CSV déposés par l'agent IA dans `raw-csv/inaxel/` | `npm run ingest-csv` | [docs/sources-csv-inaxel.md](docs/sources-csv-inaxel.md) |

Les scripts `sync-*` et `ingest-csv` sont les **stubs documentés** : prêts à être branchés au go-live, ils définissent le contrat (variables d'env, colonnes attendues) mais n'appellent pas encore les APIs.

## Validation

Chaque aggregator valide sa source via Zod ([`src/data/shared/schemas.js`](src/data/shared/schemas.js)) au chargement. Le build échoue avec un message explicite si une source ne respecte pas son schéma — protège le dashboard contre les dérives silencieuses côté sync.

## Stack technique

- **React 18** + **Vite 5**
- **Tailwind CSS 3**
- **Recharts** (graphiques)
- **Lucide React** (icônes)
- **Zod 4** (validation des sources)

## Sections UI ↔ aggregators ↔ sources

| Section UI | Aggregator | Sources |
|---|---|---|
| Vue d'ensemble | `global`, `portails`, `canaux` | piano + inaxel/reservations |
| Portails | `portails` | piano |
| SEO | `seo` | piano + gsc |
| SEA | `sea` | piano + inaxel/sea |
| CRM | `crm` | inaxel/crm |
| Budget · Commercial | `budget`, `clients` | inaxel/budget + inaxel/clients |

## Déploiement

GitHub Pages : push sur `main` déclenche
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) qui build
et publie sur <https://jerome37150.github.io/cockpit-saison-2026/>.

Protection front : mot de passe en JS (cosmétique — le bundle JS contient
les données en clair). À renforcer si la confidentialité devient critique.

## Points en attente (à confirmer avec Inaxel avant le branchement réel)

- Tagging Piano : event `clickout` sur tous les portails ? Canal "IA Générative" configuré (bucketing referrers IA) ?
- Granularité Piano : 1 property par portail ou property unique avec dimension `site` ?
- Outil de keyword tracking : on alimente `volumeRech` via Semrush/SE Ranking, ou on retire ce champ du cockpit ?
- Backoffice Inaxel : split Directe / Apporteur disponible côté résa ? Granularité mensuelle disponible pour le budget par levier ?
