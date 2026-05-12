# Source — CSV Inaxel (déposés par l'agent IA)

**Fichiers produits** :
- [`src/data/sources/inaxel/reservations.json`](../src/data/sources/inaxel/reservations.json)
- [`src/data/sources/inaxel/sea.json`](../src/data/sources/inaxel/sea.json)
- [`src/data/sources/inaxel/crm.json`](../src/data/sources/inaxel/crm.json)
- [`src/data/sources/inaxel/budget.json`](../src/data/sources/inaxel/budget.json)
- [`src/data/sources/inaxel/clients.json`](../src/data/sources/inaxel/clients.json)

**Schémas** : [`src/data/shared/schemas.js`](../src/data/shared/schemas.js) → `reservationsSchema`, `seaSchema`, `crmSchema`, `budgetSchema`, `clientsSchema`
**Ingest**  : [`scripts/ingest-csv.mjs`](../scripts/ingest-csv.mjs)
**Drop zone** : `raw-csv/inaxel/` (git-ignoré)

## Workflow

1. L'agent IA produit les CSV et les dépose dans `raw-csv/inaxel/`.
2. `npm run ingest-csv` lit ce qui est présent, écrit les JSON correspondants.
3. Comportement incrémental : un CSV manquant ne touche pas la section correspondante du JSON cible. On peut donc mettre à jour un domaine sans toucher aux autres.

## Convention générale

- **Encodage** : UTF-8 (BOM toléré).
- **Séparateur** : virgule.
- **Décimales** : point (ex. `0.967`, pas `0,967`).
- **Dates** : ISO `YYYY-MM-DD`.
- **Cellules vides** = null. Ne pas écrire `"NA"` ou `"-"`.
- **Pourcentages** : exprimés en fraction (`0.05` = 5 %), pas en `5` ni `5%`.

## Catalogue des CSV attendus

### `reservations.csv`

Réservations + CA, ventilation Directe / Apporteur / Total. Granularité : 1 row par (mois × type période × type réservation).

| Colonne | Type | Valeurs / Exemple |
|---|---|---|
| `annee` | int | `2026` |
| `mois` | date | `2026-01-01` (1er du mois) |
| `typePeriode` | str | `Réel` \| `N-1` |
| `typeReservation` | str | `Directe` \| `Apporteur` \| `Total` |
| `ca` | num | CA en € |
| `volumeResa` | int | Nombre de réservations |

### `sea-budget.csv`

Budget Google Ads par pays.

| Colonne | Type | Valeurs / Exemple |
|---|---|---|
| `annee` | int | `2026` |
| `mois` | date | `2026-01-01` |
| `pays` | str | `France`, `Allemagne`, `Italie`, ... |
| `typePeriode` | str | `Réel` \| `Prévi` |
| `budget` | num | € |

### `sea-campagnes.csv`

Liste des campagnes Google Ads en cours (snapshot).

| Colonne | Type | Exemple |
|---|---|---|
| `id` | str | `sea-1` |
| `nom` | str | `Brand FR — CampingDirect` |
| `pays` | str | `France` |
| `type` | str | `Brand` \| `Generic` \| `Concurrents` \| `Display` \| `Retargeting` |
| `statut` | str | `Active` \| `Pause` |
| `budgetMensuel` | num | € |
| `depense` | num | € |
| `impressions` | int | |
| `clics` | int | |
| `conversions` | int | |

### `crm-base.csv`

Évolution mensuelle de la base abonnés.

| Colonne | Type | Exemple |
|---|---|---|
| `annee` | int | `2026` |
| `mois` | date | `2026-01-01` |
| `totalContacts` | int | `29216` |
| `positionnes` | int | `19020` |
| `nouveaux` | int | `-103` (peut être négatif) |
| `desabos` | int | `0` |
| `netGrowth` | int | `-103` |
| `txDesab` | num | (fraction, optionnel) |

### `crm-newsletter.csv`

Performance newsletters mensuelle.

| Colonne | Type | Exemple |
|---|---|---|
| `annee` | int | `2026` |
| `mois` | date | `2026-02-01` |
| `txDelivrabilite` | num | `0.9665` (fraction) |
| `txOuverture` | num | `0.1884` |
| `txClic` | num | `0.0117` |
| `txDesab` | num | `0.0072` |
| `nouveaux` | int | (optionnel) |

### `crm-langue.csv`

Snapshot par langue.

| Colonne | Type | Exemple |
|---|---|---|
| `snapshotDate` | date | `2026-04-30` |
| `langue` | str | `FR`, `DE`, `NL`, `IT`, `ES`, `EN` |
| `positionnes` | int | |
| `txOuverture` | num | (fraction) |
| `txClic` | num | (fraction) |
| `txDesab` | num | (fraction) |

### `crm-campagnes.csv`

Planning des campagnes 2026 (1 row = 1 campagne).

| Colonne | Type | Exemple |
|---|---|---|
| `id` | str | `voeux-26` |
| `nom` | str | `Vœux 2026` |
| `type` | str | `NL` \| `Promo` \| `Évent` |
| `date` | date | `2026-01-05` |
| `audience` | str | `27 k contacts FR/DE/NL/IT/ES` |
| `objectif` | str | `Engagement / réactivation post-fêtes` |
| `color` | str | `#22D3CC` |
| `resultats` | str | JSON inline (optionnel — uniquement pour campagnes passées) |

Format de `resultats` (JSON sérialisé, échappement CSV requis) :
```json
{
  "envois": 27000, "delivres": 26109, "txDelivrabilite": 0.967,
  "ouvertures": 5483, "txOuverture": 0.210,
  "clics": 1305, "txClic": 0.050,
  "desabos": 130, "txDesab": 0.005,
  "conversions": 47,
  "parLangue": [
    { "langue": "FR", "envoi": 18180, "txOuv": 0.183, "txClic": 0.041 }
  ]
}
```

### `budget-leviers.csv`

Allocation budget par levier marketing.

| Colonne | Type | Exemple |
|---|---|---|
| `annee` | int | `2026` |
| `levier` | str | `SEO`, `SEA`, `Direct`, `IA`, `RS`, `CRM` |
| `typePeriode` | str | `Réel` \| `N-1` \| `Objectif` |
| `periode` | str | `Cumul Oct→Mars 2026` |
| `montant` | num | € |

### `budget-ca-produits.csv`

CA par produit.

| Colonne | Type | Exemple |
|---|---|---|
| `annee` | int | `2026` |
| `produit` | str | `Renouvellement`, `Display`, `Nouveau`, ... |
| `typePeriode` | str | `Réel` \| `N-1` |
| `periode` | str | `Cumul Oct→Mars 2026` |
| `montant` | num | € |

### `budget-portefeuille.csv`

Métriques portefeuille campings.

| Colonne | Type | Exemple |
|---|---|---|
| `annee` | int | `2026` |
| `metrique` | str | `Total campings`, `Abonnement`, `PPC total`, `PPC actif`, `PPC sans budget` |
| `typePeriode` | str | `Réel` \| `N-1` |
| `periode` | str | `Avril 2026` |
| `volume` | int | |

### `clients.csv`

Liste détaillée des campings clients.

| Colonne | Type | Exemple |
|---|---|---|
| `id` | str | `c-001` |
| `nom` | str | `Camping de la Plage — Argelès` |
| `pays` | str | `FR`, `DE`, `IT`, `ES`, `BE`, `NL` |
| `portail` | str | `CD`, `C2B`, `CSV`, `IB`, `AC`, `UC`, `MC` |
| `type` | str | `AB` \| `PPC` |
| `statut` | str | `Actif` \| `Sans budget` |
| `trafic` | int | |
| `clickouts` | int | |
| `txConv` | num | (fraction) |
| `resa` | int | |
| `budgetMensuel` | num | € (null si AB) |
| `budgetRestant` | num | € (null si AB) |
| `pctConsomme` | num | fraction (null si AB) |
