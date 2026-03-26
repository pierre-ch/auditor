---
name: a11y-audit-assistant
description: >
  Assistant d'audit d'accessibilité web selon RGAA 4.1.2, WCAG 2.2, EAA 2019/882 et WAI-ARIA APG 1.2.
  Utiliser ce skill dès que l'utilisateur demande un audit d'accessibilité, une analyse RGAA, un test a11y,
  une vérification WCAG, veut générer une grille de conformité Excel, ou pose une question sur les critères
  d'accessibilité d'un site web. Aussi pertinent si l'utilisateur mentionne des termes comme : accessibilité,
  RGAA, WCAG, a11y, conformité, audit, handicap numérique, DINUM, EAA, EN 301 549, lecteur d'écran, ARIA,
  ou demande d'évaluer un site ou une page web.
---

# a11y-audit-assistant

Assistant d'audit d'accessibilité web. Audit automatisé selon RGAA 4.1.2 (référentiel principal), avec correspondances WCAG 2.2, EAA 2019/882 et WAI-ARIA APG 1.2.

## Pour commencer

1. Lire les **instructions complètes** : `steering/a11y-auditor.md`
2. Lire les **steering Kiro** : `.kiro/steering/` (data-formats.md, resilience-mcp.md, quality-first.md, a11y-conventions.md, audit-execution.md)
3. Vérifier les prérequis : `npm run check-deps`
4. Si les références JSON sont manquantes : `npm run update-refs`

## Livrables produits

- **Rapport Markdown** conforme au modèle officiel RGAA DINUM (un rapport global + un par page)
- **Grille Excel (.xlsx)** avec les 106 critères RGAA, colorée par statut, onglet synthèse

## Structure du skill

```
a11y-audit-assistant/
├── POWER.md                          ← Ce fichier (point d'entrée)
├── steering/
│   └── a11y-auditor.md               ← Instructions complètes (5 phases)
├── references/
│   ├── rgaa-criteres.json            ← 13 thématiques, 106 critères
│   ├── rgaa-glossaire.json           ← Glossaire officiel RGAA
│   ├── wcag-sc.json                  ← 87 Success Criteria WCAG 2.2
│   ├── eaa-references.json           ← Directive 2019/882 (articles + annexes)
│   ├── aria-patterns.json            ← 30 patterns APG (keyboard + ARIA props)
│   ├── mapping-rgaa-wcag-eaa.json    ← Table croisée RGAA ↔ WCAG ↔ EAA
│   ├── criteres-revue-manuelle.md    ← Guide de revue manuelle
│   ├── rapport-template.md           ← Template du rapport Markdown
│   └── rgaa4.1.2.modele-de-grille-d-audit.ods
└── scripts/
    ├── generate-xlsx.mjs             ← Génération Excel
    ├── check-deps.mjs                ← Vérification prérequis
    ├── update-references.mjs         ← Téléchargement références officielles
    └── references-config.json        ← Config sources + versions
```

## Référentiels et versions

| Référentiel | Version | Fichier |
|---|---|---|
| RGAA | 4.1.2 (DINUM) | `rgaa-criteres.json` |
| WCAG | 2.2 (W3C) | `wcag-sc.json` |
| EAA | Directive 2019/882 | `eaa-references.json` |
| WAI-ARIA APG | 1.2 (W3C) | `aria-patterns.json` |

## Prérequis

| Composant | Type | Vérification |
|---|---|---|
| Node.js ≥ 18 | Bloquant | `node --version` |
| Playwright MCP | Bloquant | Configuré dans `.kiro/settings/mcp.json` |
| Références JSON | Bloquant | `npm run update-refs` |
| exceljs | Bloquant | `npm install exceljs` |