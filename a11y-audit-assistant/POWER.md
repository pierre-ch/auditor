# a11y-audit-assistant

Assistant d'audit d'accessibilité web. Analyse automatisée selon RGAA 4.1.2 (référentiel principal), WCAG 2.2, EAA 2019/882 et WAI-ARIA APG 1.2.

## Capacités

- Audit combinant axe-core (injecté via Playwright) + analyse IA thématique RGAA critère par critère
- Analyse HTML + CSS + JavaScript (pas juste le HTML)
- Mapping RGAA → WCAG → EAA avec classification de sévérité
- Suggestions de correction avec code avant/après
- Rapport Markdown (modèle officiel RGAA DINUM) + Grille Excel RGAA (.xlsx)

## Flux d'audit en 5 phases

1. **Prérequis** — vérification Node.js, Playwright MCP, références, config
2. **Scan technique** — axe-core + arbre a11y + HTML/CSS + screenshot + tests dynamiques
3. **Analyse IA thématique** — 13 thématiques RGAA, critère par critère, en profondeur
4. **Fusion et cohérence** — axe-core + IA → 106 critères validés
5. **Rapport + Grille Excel** — livrables conformes au modèle officiel RGAA

## Serveur MCP : Playwright

axe-core injecté via `browser_evaluate` ou `page.addScriptTag` (contournement CSP).

## Référentiels

| Référentiel | Version |
|---|---|
| RGAA | 4.1.2 (DINUM) |
| WCAG | 2.2 (W3C) |
| EAA | Directive 2019/882 ([lien ELI](https://eur-lex.europa.eu/eli/dir/2019/882/oj)) |
| WAI-ARIA APG | 1.2 (W3C) |

## Structure du Power

```
a11y-audit-assistant/
├── POWER.md
├── mcp.json
├── steering/
│   └── a11y-auditor.md
├── references/
│   ├── rgaa-criteres.json
│   ├── wcag-sc.json
│   ├── eaa-references.json
│   ├── aria-patterns.json
│   ├── rgaa-glossaire.json
│   ├── criteres-revue-manuelle.md
│   └── rgaa4.1.2.modele-de-grille-d-audit.ods
└── scripts/
    ├── generate-xlsx.mjs
    ├── check-deps.mjs
    ├── update-references.mjs
    └── references-config.json
```

## Prérequis

`npm run check-deps` pour vérifier.

| Composant | Type |
|---|---|
| Node.js ≥ 18 | Bloquant |
| Playwright MCP | Bloquant |
| Fichiers de référence JSON | Bloquant (`npm run update-refs`) |
| exceljs | Bloquant (`npm install exceljs`) |
| Template ODS | Consentement requis |
