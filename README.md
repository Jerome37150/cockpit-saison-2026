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

## Architecture data

**Source unique : la page Notion [« Cockpit Saison 2026 »](https://www.notion.so/3588db15623a81e79971cc2400614efc).**
Aucune donnée n'est en dur dans le code.

```
Notion  →  src/data/cockpit-2026.notion.json  →  src/data/cockpit.js  →  React
            (rows brutes,                        (agrégation par mois,
             output du sync)                      par portail, par levier…)
```

- `src/data/cockpit-2026.notion.json` : dump brut des 7 bases Notion (1 ligne = 1 enregistrement). Régénéré par le script de sync.
- `src/data/cockpit.js` : transforme les rows brutes vers les structures consommées par les composants UI (`GLOBAL`, `PORTAILS`, `CANAUX`, `SEA_PERF`, etc.).
- `src/cockpit-saison-2026.jsx` : la UI, ne fait que consommer `cockpit.js`.

## Mise à jour des données depuis Notion

### Pré-requis (à faire une fois)

1. **Créer une intégration Notion** : <https://www.notion.so/profile/integrations> → "New integration" → choisir le workspace Inaxel → copier le secret (`secret_…`).
2. **Partager les 7 bases avec l'intégration** : ouvrir la page « Cockpit Saison 2026 » dans Notion → menu `…` → `Connections` → ajouter l'intégration créée. Les 7 sous-bases héritent de la permission.
3. **Créer un fichier `.env` à la racine** :

   ```
   NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   ⚠️ Ce fichier est git-ignoré. Ne jamais le commiter.

### Lancer une synchronisation

```bash
npm run sync-notion
```

Le script `scripts/sync-notion.mjs` :
1. Lit le token dans `.env`
2. Pagine les 7 bases Notion
3. Extrait les properties → écrit `src/data/cockpit-2026.notion.json`
4. Le `syncedAt` (timestamp) est mis à jour automatiquement et affiché en pied de page

Le hot-reload Vite recharge le dashboard immédiatement.

## Structure du projet

```
src/
├── cockpit-saison-2026.jsx       UI (composants React + pages)
├── main.jsx                      Point d'entrée React
├── index.css                     Tailwind + styles globaux
└── data/
    ├── cockpit.js                Module d'agrégation (Notion → structures UI)
    └── cockpit-2026.notion.json  Dump brut des 7 bases Notion (240 rows)

scripts/
└── sync-notion.mjs               Script de synchronisation Notion → JSON

public/favicon.svg
index.html · package.json · vite.config.js · tailwind.config.js · postcss.config.js
```

## Stack technique

- **React 18** + **Vite 5**
- **Tailwind CSS 3**
- **Recharts** (graphiques)
- **Lucide React** (icônes)
- **@notionhq/client** (sync, devDep)

## Bases Notion mappées

| Base Notion | Section UI |
|---|---|
| 📈 Trafic & Clickouts par portail | Vue d'ensemble · Portails |
| 🛒 Réservations & CA | Vue d'ensemble · Commercial |
| 🌐 Acquisition par canal | Vue d'ensemble (mix canaux) |
| 🎯 SEA & Pays cible | SEA |
| 🔍 SEO Performance & Marchés | SEO |
| ✉️ CRM & Newsletter | CRM |
| 💰 Budget & Commercial | Budget · Commercial |

Ce qui n'est pas dans Notion ne s'affiche pas. Pour ajouter une donnée : créer la colonne / la row dans Notion, étendre le mapping dans `scripts/sync-notion.mjs` puis l'agrégation dans `src/data/cockpit.js`.
