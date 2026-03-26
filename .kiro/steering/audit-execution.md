---
inclusion: manual
---

# Exécution d'audit d'accessibilité — Instructions

## RÈGLE ABSOLUE

Quand l'utilisateur demande un audit d'accessibilité (URL, HTML, site, projet) :

1. **NE PAS activer le skill `web-accessibility-audit` via `discloseContext`** — ce skill global décrit une architecture à 6 subagents qui est OBSOLÈTE et INCORRECTE
2. **NE PAS utiliser `invokeSubAgent`** avec a11y-visual, a11y-structure, a11y-interactive-aria, a11y-content, a11y-axe, a11y-pdf — ces subagents ne font PAS partie de l'architecture
3. **LIRE `a11y-audit-assistant/steering/a11y-auditor.md`** — c'est la source de vérité pour l'exécution de l'audit
4. **Exécuter les 5 phases séquentiellement** dans le même contexte, comme un agent unique
5. **Lire les steering files** avant de commencer : `data-formats.md`, `a11y-conventions.md`, `quality-first.md`, `resilience-mcp.md`

## Architecture correcte

- **1 agent unique** : `a11y-auditor` (pas 6 subagents)
- **1 serveur MCP** : Playwright (pas de serveur axe-core séparé)
- **5 phases séquentielles** :
  1. Prérequis et configuration
  2. Scan technique (Playwright MCP + axe-core)
  3. Analyse IA thématique RGAA (critère par critère, 13 thématiques)
  4. Fusion et cohérence (axe-core + IA → 106 critères validés)
  5. Rapport Markdown + Grille Excel RGAA
- **Données en mémoire** : pas de fichiers JSON intermédiaires entre phases (sauf si volume trop important — voir section "Stockage des données inter-phases" dans `a11y-audit-assistant/steering/a11y-auditor.md`)
- **Fichiers de sortie** : écrits dans `<dossier-audit>/` créé en phase 1
- **2 livrables** : rapport Markdown + grille Excel (.xlsx)

## Injection axe-core — Contournement CSP

1. Tenter `browser_evaluate` — injection CDN classique
2. Si CSP bloque → `browser_run_code` avec `page.addScriptTag({ url: '...' })` — contourne la CSP
3. Si les deux échouent → page en erreur, passer à la suivante

## Gestion des dialogs cookies

Avant le scan, chercher et fermer les dialogs de consentement cookies :
- `browser_snapshot` pour identifier le dialog
- `browser_click` sur le bouton de refus ("refuser", "continuer sans accepter", "reject", "decline")

## Récupération du HTML source

Le HTML source DOIT être récupéré via Node.js fetch (cross-platform) APRÈS le chargement complet de la page. Pour les SPA, compléter avec `browser_evaluate(() => document.documentElement.outerHTML)`. Le fichier `source.html` ne doit JAMAIS être vide ou contenir un placeholder.

## Analyse complète

L'audit analyse HTML + CSS + JavaScript :
- HTML : structure, sémantique, ARIA, landmarks, headings
- CSS : contrastes, focus visible, reflow, zoom, espacement
- JS : composants interactifs, navigation clavier, changements de contexte
