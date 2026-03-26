# Tâches — a11y-audit-assistant

## Tâches

- [x] 1. Réécrire le prompt agent `a11y-audit-assistant/steering/a11y-auditor.md`
  - [x] 1.1 Phase 1 — Prérequis et configuration
    - Vérification prérequis (Node.js, Playwright MCP, références JSON, exceljs, template ODS)
    - Détection mode, valeurs par défaut, confirmation utilisateur
    - _Exigences : 1, 14_
  - [x] 1.2 Phase 2 — Scan technique Playwright
    - Injection axe-core (`browser_evaluate` puis fallback `browser_run_code` + `page.addScriptTag` si CSP)
    - Collecte : arbre a11y, HTML source (Node.js fetch + DOM rendu), CSS computé, screenshot, tests dynamiques
    - Gestion dialog cookies (fermer avant scan)
    - _Exigences : 2, 7, 15_
  - [x] 1.3 Phase 3 — Analyse IA thématique RGAA
    - Boucle sur les 13 thématiques, critère par critère
    - Pour chaque thématique : extraire éléments HTML pertinents, analyser avec arbre a11y + CSS + screenshot
    - Consulter `references/rgaa-criteres.json` et `references/criteres-revue-manuelle.md`
    - Produire statut argumenté (C/NC/NA/NT) avec justification par critère
    - Inclure analyse CSS (contrastes, focus, reflow) et JS (composants ARIA, interactions)
    - _Exigences : 3, 3b, 6_
  - [x] 1.4 Phase 4 — Fusion et cohérence
    - Fusionner axe-core + analyse IA, résoudre conflits
    - Vérifier 106 critères complets, pas de doublons/orphelines
    - Enrichir avec WCAG + EAA (via `references/mapping-rgaa-wcag-eaa.json`)
    - _Exigences : 1.20–1.22_
  - [x] 1.5 Phase 5 — Rapport MD + Grille Excel
    - Rapport conforme modèle officiel RGAA (DINUM)
    - Grille via `scripts/generate-xlsx.mjs`
    - Vérification cohérence MD ↔ Excel
    - _Exigences : 4, 5_

- [x] 2. Mettre à jour les steering files workspace
  - [x] 2.1 `.kiro/steering/a11y-conventions.md` — aligner sur le nouveau flux 5 phases
  - [x] 2.2 `.kiro/steering/data-formats.md` — simplifier si nécessaire
  - [x] 2.3 `.kiro/steering/resilience-mcp.md` — ajouter fallback CSP (`page.addScriptTag`)
  - [x] 2.4 `.kiro/steering/audit-execution.md` — aligner sur le nouveau flux

- [x] 3. Mettre à jour le POWER.md
  - [x] 3.1 POWER.md — décrire le nouveau flux 5 phases
  - [x] 3.2 mcp.json — supprimé du skill (doublon de `.kiro/settings/mcp.json`)

- [x] 4. Mettre à jour les scripts
  - [x] 4.1 `scripts/check-deps.mjs` — vérifier les chemins relatifs depuis le Power
  - [x] 4.2 `scripts/generate-xlsx.mjs` — vérifier les chemins

- [ ] 5. Test d'audit complet
  - [ ] 5.1 Tester sur leboncoin.fr avec le nouveau flux
  - [ ] 5.2 Vérifier que l'analyse IA couvre les 13 thématiques en profondeur
  - [ ] 5.3 Vérifier la cohérence du rapport et de la grille Excel

- [ ]* 6. Tests property-based (optionnel)
  - [ ]* 6.1 Tests logique déterministe (fast-check)
  - [ ]* 6.2 Tests de schéma (zod)
  - [ ]* 6.3 Tests d'intégration avec fixtures
