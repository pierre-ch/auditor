---
description: Stratégies de résilience Playwright MCP pour l'agent a11y-auditor. Retry, fallback et gestion des erreurs pour chaque outil MCP.
globs:
  - a11y-audit-assistant/**
  - .kiro/specs/a11y-audit-assistant/**
---

# Résilience Playwright MCP — Stratégies de retry et fallback

## Principe fondamental

NE JAMAIS abandonner silencieusement. Chaque échec MCP doit être retryé, puis fallbacké, puis consigné. Le ton dans le chat doit rester naturel — dire "Le screenshot pleine page a pris trop de temps, je capture le viewport visible à la place" au lieu d'afficher des messages techniques bruts.

## Injection axe-core — Contournement CSP

Certains sites (craigslist, leboncoin) ont une Content Security Policy stricte qui bloque l'injection de scripts externes via `browser_evaluate`. Stratégie en 2 étapes :

1. **Tenter `browser_evaluate`** — injection CDN classique
2. **Si CSP bloque** → **`browser_run_code`** avec `page.addScriptTag({ url: '...' })` — contourne la CSP car exécuté dans le contexte Playwright, pas dans la page
3. **Si les deux échouent** → page en erreur, passer à la suivante

```javascript
// Fallback CSP via browser_run_code
async (page) => {
  await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.3/axe.min.js' });
  return await page.evaluate(() => axe.run({ runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } }));
}
```

## Dialog cookies/consentement

Avant le scan, chercher et fermer les dialogs de consentement cookies. Patterns courants :
- `button` contenant "refuser", "continuer sans accepter", "reject", "decline"
- `browser_snapshot` pour identifier le dialog, puis `browser_click` sur le bouton de refus

## Screenshot pleine page (pages longues/lourdes)

Le `browser_take_screenshot({ fullPage: true })` peut timeout sur les pages avec beaucoup d'images, animations ou lazy-loading. Stratégie en 3 étapes :

1. **Tenter fullPage** : `browser_take_screenshot({ fullPage: true })`
2. **Si timeout** → **Scroll + screenshots multiples** :
   ```
   browser_evaluate(() => document.body.scrollHeight)  // hauteur totale
   // Boucle : scroll par viewport, screenshot à chaque position
   browser_evaluate(() => window.scrollTo(0, <offset>))
   browser_take_screenshot({ filename: "capture-part-N.png" })
   // Remonter en haut après
   browser_evaluate(() => window.scrollTo(0, 0))
   ```
3. **Si scroll échoue aussi** → **Screenshot viewport seul** : `browser_take_screenshot()` (viewport courant)

Toujours consigner quelle stratégie a été utilisée.

## Sauvegarde du HTML source complet

Stratégie cross-platform (fonctionne sur Windows, Mac, Linux) :

1. **Méthode principale — Node.js fetch** (cross-platform, Node.js est un prérequis) :
   ```
   executePwsh: node -e "fetch('<URL>').then(r=>r.text()).then(h=>require('fs').writeFileSync('<path>/source.html',h))"
   ```
   ⚠ Ceci sauvegarde le HTML serveur (avant JS). Rapide et fiable.

2. **Méthode complémentaire — DOM rendu via browser_evaluate** :
   Si le HTML serveur est insuffisant (SPA, contenu généré par JS), extraire le DOM rendu :
   ```
   // Mesurer la taille
   browser_evaluate(() => document.documentElement.outerHTML.length)
   // Si ≤ 50 Ko : écrire directement via fsWrite
   // Si > 50 Ko : extraire en chunks de 40 Ko via browser_evaluate + fsWrite/fsAppend
   ```

3. **NE PAS utiliser** `require()` ou `import()` dans `browser_run_code` — le contexte Playwright MCP ne les supporte pas.

4. **Validation** : Vérifier que `source.html` existe, fait > 100 octets, et contient `<html`, `<head`, `<body`. Si échec → consigner, continuer sans.

## Table des erreurs MCP — Retry et fallback

Pour CHAQUE appel Playwright MCP, appliquer cette logique :

| Erreur MCP | Retry | Fallback |
|---|---|---|
| `TimeoutError` (screenshot, evaluate, navigate) | Retry 1 fois | Screenshot → scroll+multi ou viewport. Evaluate → réduire la taille du script. Navigate → vérifier l'URL |
| `ENOENT` (fichier/répertoire manquant) | Créer le répertoire via `executePwsh` AVANT, puis retry | Consigner, continuer sans le fichier |
| `Target closed` / `Page crashed` | `browser_navigate(url)` pour recharger, puis retry | Si 2e crash → page en erreur, passer à la suivante |
| `Execution context was destroyed` | `browser_navigate(url)` puis retry | La page a navigué pendant l'opération — recharger |
| `Protocol error` / `Connection refused` | Attendre 2s, retry 1 fois | Si persistant → Playwright MCP est down, arrêter proprement |
| `browser_evaluate` retourne `undefined` ou erreur JS | Vérifier que la page est chargée (`document.readyState === 'complete'`), retry | Réduire la complexité du script, découper en étapes |
| `browser_snapshot` retourne un arbre vide | Attendre 2s (page en cours de rendu), retry | Fallback analyse statique HTML |
| `browser_press_key` sans effet visible | Vérifier le focus actuel via `browser_snapshot`, retry avec focus explicite | Consigner, marquer le test clavier comme non concluant |
| `browser_resize` n'applique pas la taille | Vérifier via `browser_evaluate(() => window.innerWidth)`, retry | Consigner, marquer reflow comme NT |
| `browser_hover` ne déclenche pas de changement | Vérifier le sélecteur, retry avec un ref différent | Fallback analyse CSS statique des pseudo-classes :hover |
| CDN axe-core inaccessible (script.onerror) | Retry avec URL alternative ou version inline | Page en erreur si axe-core indispensable |
| `axe.run()` timeout (page très complexe) | Retry avec un contexte réduit : `axe.run(document.querySelector('main'))` | Scan partiel, consigner les zones non scannées |
| Résultat `browser_evaluate` tronqué (> limite) | Découper l'extraction en chunks plus petits | Utiliser `executePwsh` comme alternative |

## Table des erreurs par phase

| Erreur | Phase | Comportement |
|---|---|---|
| Échec injection axe-core | Scan | Page en erreur, passer à la suivante |
| Échec `browser_snapshot` | Scan | Fallback analyse statique HTML + règles ARIA axe-core |
| Échec screenshot fullPage (TimeoutError) | Scan | **Retry 1** : scroll par viewport + screenshots multiples. **Retry 2** : screenshot viewport seul. Consigner quelle stratégie utilisée |
| Échec screenshot (ENOENT) | Scan | Créer le répertoire via `executePwsh` PUIS retry. **Toujours créer les répertoires AVANT les appels screenshot** |
| Échec test dynamique individuel | Scan | Fallback analyse statique, les autres tests continuent |
| Échec PDF (timeout, 404, trop volumineux) | Scan | Marquer "non vérifié", consigner URL |
| Échec média (codec, stream) | Scan | Marquer "non vérifié" |
| Échec sauvegarde HTML (require/import non défini) | Scan | Utiliser Node.js fetch via `executePwsh` (cross-platform), ou `browser_evaluate` en chunks de 40 Ko + `fsWrite`/`fsAppend` |
| HTML source vide ou placeholder | Scan | Vérifier que `source.html` contient `<html`, `<head`, `<body`. Si vide → re-extraire via Node.js fetch ou `browser_evaluate` en chunks |
| Playwright MCP déconnexion | Toutes | Tenter reconnexion 1 fois, sinon arrêter proprement |
| Échec phase analyse IA thématique (timeout LLM) | Phase 3 | Livrer résultats axe-core seuls sans enrichissement IA, avertir |
| Échec `generate-xlsx` (script Node.js) | Phase 5 | Vérifier que exceljs est installé (`npm install exceljs`). Livrer MD + JSON d'instructions, consigner l'erreur |
| `eaa-references.json` absent | Phase 3 | Omettre enrichissement EAA, avertir |
| Espace disque plein en cours d'audit | Toutes | Arrêter proprement, livrer résultats déjà produits |
| axe-core 0 violations | Scan | Avertir (résultat inhabituel, possible problème de chargement) |
| `grille-instructions.json` invalide | Phase 5 | Signaler erreurs de structure avant appel generate-xlsx |

## Ordre des opérations critiques

1. **TOUJOURS créer les répertoires** (`executePwsh`) AVANT tout appel `browser_take_screenshot` ou `fsWrite`
2. **TOUJOURS vérifier que la page est chargée** (`browser_snapshot` ou `browser_evaluate(() => document.readyState)`) AVANT d'injecter axe-core
3. **TOUJOURS valider source.html** après sauvegarde (taille > 100 octets, contient `<html`)
4. **TOUJOURS vérifier exceljs** en Phase 1 (`node -e "require('exceljs')"`)
5. **NE JAMAIS utiliser `require()` ou `import()` dans `browser_run_code`** — le contexte Playwright MCP ne les supporte pas

## Format d'erreur structuré

Chaque erreur DOIT être consignée avec le contexte complet :

```json
{
  "erreur": true,
  "phase": "scan | analyse_ia | fusion | rapport_grille",
  "etape": "axe-core | arbre-a11y | clavier | contrastes | pdf | medias | reflow | zoom | ...",
  "page_id": "p01",
  "message": "Description lisible de l'erreur",
  "detail": "Détail technique (URL, stack, etc.)"
}
```

_Exigences couvertes : 15.1–15.8_
