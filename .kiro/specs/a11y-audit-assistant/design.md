# Design — a11y-audit-assistant

## Vue d'ensemble

Power Kiro d'audit d'accessibilité web. Agent unique `a11y-auditor` exécutant 5 phases séquentielles selon le RGAA 4.1.2 (référentiel principal), avec correspondances WCAG 2.2 et EAA 2019/882.

Architecture : un agent, un serveur MCP (Playwright), des données de référence embarquées. L'agent collecte les données via Playwright, puis analyse chaque thématique RGAA en profondeur.

## Flux d'audit en 5 phases

```
Phase 1 — Prérequis et configuration
Phase 2 — Scan technique (Playwright MCP + axe-core)
Phase 3 — Analyse IA thématique RGAA (critère par critère, HTML+CSS+arbre a11y+screenshot)
Phase 4 — Fusion et cohérence (axe-core + IA → 106 critères validés)
Phase 5 — Rapport Markdown + Grille Excel RGAA
```

### Phase 1 — Prérequis

Vérifier : Node.js, Playwright MCP, fichiers de référence JSON, exceljs, template ODS.
Détecter le mode (url/html/site/project), appliquer les valeurs par défaut, confirmer avec l'utilisateur.

### Phase 2 — Scan technique

Collecte maximale via Playwright MCP. Tout est sauvegardé pour la phase 3.

| Sous-module | Outil | Données collectées |
|---|---|---|
| axe-core | `browser_run_code` (addScriptTag) ou `browser_evaluate` | violations, passes, incomplete |
| Arbre a11y | `browser_snapshot` | Rôles ARIA, noms accessibles |
| HTML source | Node.js fetch + `browser_evaluate` (DOM rendu) | HTML complet (serveur + rendu JS) |
| CSS computé | `browser_evaluate` (getComputedStyle) | Styles des éléments clés |
| Screenshot | `browser_take_screenshot` | Pleine page + reflow 320px |
| Navigation clavier | `browser_press_key` | Ordre tabulation, pièges, focus visible |
| Reflow 320px | `browser_resize` + `browser_evaluate` | Défilement horizontal |
| Zoom 200% | `browser_evaluate` | Chevauchements, troncatures |

Injection axe-core : d'abord `browser_evaluate` (CDN). Si CSP bloque → `browser_run_code` avec `page.addScriptTag`. Si les deux échouent → page en erreur.

### Phase 3 — Analyse IA thématique RGAA

C'est le cœur de l'audit. L'IA parcourt les 13 thématiques RGAA, critère par critère, en utilisant les données collectées en phase 2.

Pour chaque thématique, l'IA :
1. Charge les critères depuis `a11y-audit-assistant/references/rgaa-criteres.json`
2. Extrait les éléments HTML pertinents (images pour thématique 1, formulaires pour thématique 11, etc.)
3. Consulte l'arbre a11y, le CSS computé, le screenshot
4. Consulte `a11y-audit-assistant/references/criteres-revue-manuelle.md` pour les vérifications spécifiques
5. Produit un statut argumenté par critère (C/NC/NA/NT) avec justification

| Thématique | Éléments analysés | Sources de données |
|---|---|---|
| 1. Images | `<img>`, `<svg>`, `<canvas>`, images CSS | HTML + arbre a11y + screenshot |
| 2. Cadres | `<iframe>`, `<frame>` | HTML + arbre a11y |
| 3. Couleurs | Textes, composants d'interface | CSS computé + axe-core contrastes |
| 4. Multimédia | `<video>`, `<audio>`, `<track>` | HTML + arbre a11y |
| 5. Tableaux | `<table>`, `<th>`, `<td>` | HTML + arbre a11y |
| 6. Liens | `<a>`, liens-images | HTML + arbre a11y |
| 7. Scripts | Composants ARIA, interactions JS | HTML + arbre a11y + clavier |
| 8. Éléments obligatoires | `<html lang>`, `<title>`, DOCTYPE | HTML |
| 9. Structuration | Headings h1-h6, landmarks, listes | HTML + arbre a11y |
| 10. Présentation | CSS, focus, reflow, zoom | CSS computé + tests dynamiques |
| 11. Formulaires | `<input>`, `<label>`, autocomplete | HTML + arbre a11y |
| 12. Navigation | Skip links, tabulation, landmarks | HTML + arbre a11y + clavier |
| 13. Consultation | PDF, animations, orientation | HTML + CSS + tests dynamiques |

Chaque NC produite inclut : critère RGAA, critère WCAG correspondant, référence EAA si applicable, sévérité, description, code avant/après, priorité.

### Phase 4 — Fusion et cohérence

Fusionner les résultats axe-core (phase 2) et l'analyse IA (phase 3) :
- Si axe-core dit NC et l'IA dit C → axe-core a priorité (critères automatisables)
- Si l'IA dit NC et axe-core n'a rien → garder la NC IA avec justification
- Vérifier que les 106 critères ont un statut (C/NC/NA/NT)
- Pas de doublons, pas d'orphelines
- Recalculer les statistiques (taux de conformité, répartition par sévérité)

### Phase 5 — Rapport et Grille Excel

Rapport Markdown conforme au modèle officiel RGAA (DINUM) + grille Excel via `a11y-audit-assistant/scripts/generate-xlsx.mjs`.
Vérification cohérence MD ↔ Excel critère par critère avant livraison.

## Décisions de conception

| Décision | Justification |
|---|---|
| Agent unique | Kiro ne supporte pas le chaînage d'agents avec passage de données. Un agent unique conserve le contexte. |
| Playwright MCP unique | axe-core injecté via `browser_evaluate` ou `page.addScriptTag` (contournement CSP). |
| Analyse IA thématique | Découper par thématique réduit le contexte nécessaire et force une analyse exhaustive. |
| RGAA comme référentiel principal | Le RGAA structure l'audit (106 critères, 13 thématiques). WCAG et EAA sont des références croisées. |
| Données de référence embarquées | `rgaa-criteres.json`, `wcag-sc.json`, `eaa-references.json`, `aria-patterns.json` dans le Power. |

## Structure du Power

```
a11y-audit-assistant/
├── POWER.md
├── mcp.json
├── steering/
│   └── a11y-auditor.md
├── references/
│   ├── rgaa-criteres.json
│   ├── rgaa-glossaire.json
│   ├── wcag-sc.json
│   ├── aria-patterns.json
│   ├── eaa-references.json
│   ├── criteres-revue-manuelle.md
│   └── rgaa4.1.2.modele-de-grille-d-audit.ods
└── scripts/
    ├── generate-xlsx.mjs
    ├── check-deps.mjs
    ├── update-references.mjs
    └── references-config.json
```

## Structure du workspace d'audit (output)

```
audit-YYYY-MM-DD/
├── rapport-global.md
├── grille-rgaa.xlsx
├── grille-instructions.json
└── p01-nom/
    ├── source.html
    ├── capture.png
    └── rapport.md
```

## Gestion des erreurs

| Erreur | Comportement |
|---|---|
| CSP bloque axe-core via `browser_evaluate` | Fallback `browser_run_code` + `page.addScriptTag` |
| Échec injection axe-core (les deux méthodes) | Page en erreur, passer à la suivante |
| Échec screenshot fullPage | Scroll+multi screenshots, puis viewport seul |
| Échec test dynamique | Fallback analyse statique, les autres tests continuent |
| Dialog cookies/consentement | Fermer avant le scan (chercher bouton refuser/continuer) |
| Playwright MCP déconnexion | Retry 1 fois, sinon arrêter proprement |

Détails des stratégies de résilience dans `.kiro/steering/resilience-mcp.md`.
