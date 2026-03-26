---
description: Conventions agent et accessibilité pour le Power a11y-audit-assistant
globs:
  - a11y-audit-assistant/**
  - .kiro/specs/a11y-audit-assistant/**
---

# Conventions — a11y-audit-assistant

## Agent unique

| Agent | Fichier | Rôle |
|---|---|---|
| `a11y-auditor` | `a11y-audit-assistant/steering/a11y-auditor.md` | Agent unique, 5 phases séquentielles |

## Serveur MCP unique

Playwright MCP. axe-core injecté via `browser_evaluate` ou `browser_run_code` + `page.addScriptTag` (fallback CSP).

## Flux d'audit en 5 phases

```
Phase 1 — Prérequis et configuration
Phase 2 — Scan technique (Playwright MCP + axe-core)
Phase 3 — Analyse IA thématique RGAA (critère par critère, 13 thématiques)
Phase 4 — Fusion et cohérence (axe-core + IA → 106 critères)
Phase 5 — Rapport Markdown + Grille Excel RGAA
```

## Classification des Non-Conformités

| Sévérité | Définition |
|---|---|
| **Bloquante** | Empêche l'accès au contenu ou à une fonctionnalité |
| **Majeure** | Gêne significative dans l'utilisation |
| **Mineure** | Gêne légère sans empêcher l'accès |

Critères de détermination : type d'élément, position dans la page, rôle fonctionnel, impact axe-core (`critical` → bloquante, `serious` → majeure, `moderate`/`minor` → mineure).

## Sources de détection

| Source | Description |
|---|---|
| `axe-core` | Violations détectées par axe-core injecté |
| `arbre-a11y` | Détectée via `browser_snapshot` |
| `clavier` | Navigation clavier via `browser_press_key` |
| `contrastes` | axe-core + CSS computé |
| `analyse-ia` | Raisonnement IA sur critères non automatisables (avec `niveau_confiance` et `justification`) |

## Statuts des critères RGAA

| Statut | Code Excel | Signification |
|---|---|---|
| `conforme` | C | Critère respecté |
| `non_conforme` | NC | Au moins une NC détectée |
| `non_applicable` | NA | Critère ne s'applique pas |
| `revue_manuelle_necessaire` | NT | Jugement humain requis |

## Référentiels

Versions dans `a11y-audit-assistant/scripts/references-config.json`. RGAA = référentiel principal. WCAG et EAA = références croisées.
EAA : lien ELI stable `https://eur-lex.europa.eu/eli/dir/2019/882/oj`
