# Document d'Exigences — a11y-audit-assistant

## Introduction

Skill Kiro d'audit d'accessibilité web à agent unique (`a11y-auditor`). L'agent exécute séquentiellement 5 phases : vérification des prérequis, scan technique (axe-core injecté via Playwright MCP `browser_evaluate` + tests dynamiques navigateur + analyse statique), analyse IA thématique RGAA (mapping déterministe WCAG → RGAA + raisonnement sémantique sur les critères non automatisables), fusion et cohérence, puis génération du rapport Markdown et de la grille Excel.

Outillage : Node.js pour la génération Excel (`exceljs` via `a11y-audit-assistant/scripts/generate-xlsx.mjs`), la mise à jour des référentiels (`a11y-audit-assistant/scripts/update-references.mjs` + `a11y-audit-assistant/scripts/references-config.json`), Playwright MCP (serveur MCP unique) pour toute l'interaction navigateur (injection axe-core, arbre d'accessibilité, screenshots, tests dynamiques). Référentiels : RGAA, WCAG, EAA, WAI-ARIA APG.

**Notes sur les données en français** : La grille Excel RGAA reste toujours en français (document officiel). Les données de référence RGAA restent en français (source officielle).

## Glossaire

- **Agent_Auditor** : Agent unique (`a11y-auditor`) exécutant séquentiellement les 5 phases de l'audit. Les phases internes sont : prérequis (1), scan technique (2), analyse IA thématique RGAA (3, inclut mapping déterministe + révision sémantique), fusion et cohérence (4), rapport MD + grille Excel (5).
- **Phase_Scan** : Phase 2 de l'agent — collecte des données brutes d'accessibilité via axe-core injecté par `browser_evaluate`, Playwright MCP (`browser_snapshot`, `browser_take_screenshot`, `browser_press_key`, `browser_resize`, `browser_evaluate`, `browser_hover`) et analyse statique HTML/CSS. 8 sous-modules. Produit des données structurées en mémoire.
- **Phase_Analyse_IA** : Phase 3 de l'agent — parcourt les 13 thématiques RGAA critère par critère. Combine le mapping déterministe WCAG → RGAA (sévérité, enrichissement EAA, corrections) et le raisonnement sémantique IA sur les critères non automatisables. Chaque NC issue du raisonnement IA est marquée source="analyse-ia" avec niveau de confiance.
- **Phase_Fusion** : Phase 4 de l'agent — fusionne les résultats axe-core (phase 2) et l'analyse IA (phase 3), résout les conflits, vérifie que les 106 critères ont un statut, recalcule les statistiques.
- **Phase_Rapports** : Phase 5 de l'agent — production du rapport Markdown conforme au modèle officiel RGAA (DINUM, licence ouverte 2.0) et production du JSON d'instructions (`grille-instructions.json`) puis appel au script Node.js `a11y-audit-assistant/scripts/generate-xlsx.mjs`.
- **Non_Conformité (NC)** : Écart constaté entre le contenu audité et les critères d'un référentiel d'accessibilité. Classée en trois niveaux de Sévérité : bloquante, majeure, mineure.
- **RGAA** : Référentiel Général d'Amélioration de l'Accessibilité, référentiel français d'accessibilité web (dernière version en vigueur).
- **WCAG** : Web Content Accessibility Guidelines, norme internationale d'accessibilité web publiée par le W3C (dernière version en vigueur).
- **EAA** : European Accessibility Act, directive européenne sur l'accessibilité des produits et services numériques.
- **WAI-ARIA APG** : WAI-ARIA Authoring Practices Guide, guide officiel du W3C décrivant les patterns d'implémentation des composants ARIA (tabs, dialog, menu, combobox, accordion, etc.) avec les rôles, propriétés, états et comportements clavier attendus. Source : https://www.w3.org/WAI/ARIA/apg/patterns/. Les patterns sont embarqués dans `a11y-audit-assistant/references/aria-patterns.json`.
- **Axe_Core** : Moteur d'analyse d'accessibilité automatisée open source, injecté dynamiquement dans la page via Playwright MCP `browser_evaluate` (chargement depuis CDN `https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.3/axe.min.js` puis appel `axe.run()`).
- **DOM_Réel** : Arbre DOM tel que rendu par le navigateur après exécution du JavaScript.
- **Arbre_Accessibilité** : Représentation du DOM utilisée par les technologies d'assistance, exposée par le navigateur. Extraite via Playwright MCP `browser_snapshot` (mode URL uniquement). Les tests dynamiques (navigation clavier, reflow, zoom, états interactifs, contrôles vidéo) sont également réalisés via les outils Playwright MCP (`browser_press_key`, `browser_resize`, `browser_evaluate`, `browser_hover`, `browser_take_screenshot`).
- **Page_Auditée** : Page web soumise à l'audit, identifiée par un identifiant (ex: p01), un nom (ex: accueil) et une URL.
- **Sévérité** : Niveau de gravité d'une Non_Conformité : bloquante (empêche l'accès au contenu), majeure (gêne significative), mineure (gêne légère).
- **Mapping_WCAG_RGAA** : Correspondance entre les critères de succès WCAG et les 106 critères RGAA, intégrée dans le champ `references.wcag` de chaque critère dans `rgaa-criteres.json` (source DINUM). Une table croisée pré-calculée RGAA ↔ WCAG ↔ EAA est disponible dans `mapping-rgaa-wcag-eaa.json`.
- **Grille_RGAA_Officielle** : Modèle de grille d'audit officiel du RGAA au format ODS (`rgaa4.1.2.modele-de-grille-d-audit.ods`), disponible dans les a11y-audit-assistant/references/ du skill ou téléchargeable depuis le site officiel du RGAA. Structure : une feuille par page auditée (P01 à P20), 7 colonnes (Thématique, Critère, Recommandation, Statut, Dérogation, Modifications, Commentaires), 106 critères répartis en 13 thématiques.
- **Taux_Conformité** : Pourcentage de critères RGAA conformes par rapport au total des critères applicables (nombre de critères conformes / nombre de critères applicables × 100), tel que défini par le modèle officiel de rapport d'audit RGAA.
- **Erreur_Critique** : Non-conformité évidente et grave détectée automatiquement (page sans `<html lang>`, sans `<title>`, images sans `alt`, champs sans label, absence de skip link, piège clavier, absence de DOCTYPE), signalée avec la priorité la plus élevée dans les rapports.

## Exigences

### Exigence 1 : Orchestration

**User Story :** En tant qu'auditeur accessibilité, je veux que l'agent unique coordonne les 5 phases séquentielles de l'audit (prérequis, scan technique, analyse IA thématique RGAA, fusion et cohérence, rapports MD + grille Excel), afin de garantir un flux d'exécution fiable et des résultats cohérents.

#### Critères d'acceptation

1. LORSQU'un audit est initié, l'agent DOIT identifier les pages à analyser et exécuter les phases 2→3 séquentiellement sur chaque page.
2. LORSQUE la phase scan est terminée pour une page, l'agent DOIT enchaîner immédiatement avec la phase analyse IA thématique (traitement page par page), plutôt que d'attendre la fin du scan de toutes les pages.
3. LORSQUE la phase analyse IA est terminée pour une page, l'agent DOIT passer à la page suivante.
4. L'agent DOIT exécuter les phases dans l'ordre suivant par page : scan (2), analyse IA thématique (3). Après traitement de toutes les pages : fusion et cohérence (4), rapports MD + grille Excel (5).
5. SI la phase scan échoue sur une page, ALORS l'agent DOIT consigner l'erreur, poursuivre l'audit avec les pages restantes et signaler l'échec dans les rapports finaux.
6. SI la phase analyse IA échoue, ALORS l'agent DOIT interrompre le flux et signaler l'erreur à l'utilisateur avec le détail de la cause.
7. LORSQU'un audit est initié, l'agent DOIT vérifier la version du RGAA, du WCAG et de l'EAA utilisée et inclure ces informations dans les métadonnées des rapports.
8. SI une version plus récente d'un référentiel est disponible, ALORS l'agent DOIT avertir l'utilisateur avant de poursuivre l'audit.
9. L'agent DOIT agréger les résultats de toutes les phases et vérifier la cohérence des données avant de générer les rapports.
10. LORSQU'un audit est initié avec une URL de site (sans liste de pages explicite), l'agent DOIT explorer le site automatiquement (crawl des liens internes, lecture du sitemap.xml si disponible) pour découvrir les pages à auditer et proposer la liste à l'utilisateur.
11. LORSQUE des fichiers HTML/CSS sont présents dans le projet local, l'agent DOIT détecter ces fichiers et proposer à l'utilisateur de les auditer directement (mode fichiers locaux).
12. AVANT de lancer l'audit, l'agent DOIT demander à l'utilisateur le périmètre de pages à auditer : toutes les pages découvertes, une sélection manuelle, ou une seule page (mode mono-page).
13. L'agent DOIT agréger les résultats enrichis (page par page) en un format intermédiaire normalisé global avant de générer les rapports.
14. Le périmètre par défaut DOIT être déterminé automatiquement : URL unique → mono-page automatique ; site_url → demander le périmètre ; HTML fourni → mono-page automatique.
15. Le mode d'exécution DOIT être détecté automatiquement : URL → mode url, HTML fourni → mode html, fichiers projet → mode project, site_url → mode site.
16. AVANT de lancer l'audit, l'agent DOIT afficher un résumé de configuration (mode, périmètre, pages) et demander confirmation à l'utilisateur.
17. SI l'utilisateur ne précise rien (juste "audite cette page"), ALORS l'agent DOIT utiliser les valeurs par défaut et afficher le résumé pour confirmation.
18. L'agent DOIT afficher la progression de l'audit (ex: "Page 3/10 scannée", "Page 3/10 analysée").
19. AVANT le rapport complet, l'agent DOIT afficher un résumé rapide (X bloquantes, Y majeures, Z mineures).
20. AVANT de générer les rapports, l'agent DOIT valider la consolidation : pas de NC en doublon, chaque critère RGAA (1 à 106) a un statut, pas de NC orphelines, statistiques cohérentes.
21. La phase rapports (5) DOIT utiliser exactement les mêmes données en mémoire pour le MD et l'Excel, sans copie ni transformation intermédiaire.
22. Le tableau `criteres_rgaa_statuts` DOIT contenir exactement 106 entrées. SI une entrée manque, l'agent DOIT interrompre la génération des rapports et signaler l'erreur.

### Exigence 2 : Scan technique

**User Story :** En tant qu'auditeur accessibilité, je veux un scan technique qui collecte toutes les données d'accessibilité brutes des pages via axe-core (injecté via `browser_evaluate`) et Playwright MCP, afin de disposer d'une base de données complète pour l'analyse.

#### Critères d'acceptation

1. LORSQU'une Page_Auditée est soumise au scan, la phase scan DOIT injecter axe-core via Playwright MCP `browser_evaluate` (chargement CDN puis `axe.run()`) pour l'analyse d'accessibilité. En mode HTML, le code est chargé via `browser_navigate` vers une data URL avant injection.
2. LORSQUE l'analyse axe-core est terminée, la phase scan DOIT collecter la liste des violations avec pour chaque violation : l'identifiant de la règle, la description, les éléments HTML concernés, le niveau d'impact et les critères WCAG associés.
3. Axe_Core DOIT être configuré pour tester les niveaux WCAG A et AA.
4. LORSQU'une page est analysée via URL, la phase scan DOIT extraire l'Arbre_Accessibilité via Playwright MCP `browser_snapshot` afin de détecter les rôles ARIA mal implémentés, les noms accessibles manquants et les problèmes que le DOM seul ne révèle pas. En mode HTML (sans URL), cette extraction est omise et la phase scan s'appuie sur les règles ARIA d'axe-core injecté.
5. LORSQU'une page est analysée via URL, la phase scan DOIT analyser la navigation clavier via analyse statique du HTML (éléments interactifs, tabindex, styles :focus) pour estimer l'ordre de tabulation, détecter les pièges potentiels et vérifier la présence d'indicateurs de focus.
6. la phase scan DOIT vérifier les contrastes de couleurs sur les états interactifs (hover, focus) via extraction CSS par `browser_evaluate` et la règle axe-core `color-contrast`, en plus de l'état par défaut.
7. LORSQU'un élément problématique est détecté, la phase scan DOIT capturer le HTML et le CSS bruts de cet élément pour inclusion dans les résultats.
8. la phase scan DOIT produire un fichier JSON structuré par Page_Auditée contenant : les violations axe-core, l'Arbre_Accessibilité, les résultats de navigation clavier, les résultats de contraste sur états interactifs et les extraits HTML/CSS des éléments problématiques.
9. SI le serveur MCP ne parvient pas à analyser une Page_Auditée, ALORS la phase scan DOIT consigner l'erreur avec l'URL concernée et passer à la page suivante.
10. SI un timeout survient pendant le chargement d'une page, ALORS la phase scan DOIT consigner le timeout et passer à la page suivante. Le timeout par défaut DOIT être de 30 secondes et DOIT être configurable via les options d'audit.
11. la phase scan DOIT organiser ses responsabilités en 8 sous-modules distincts : exécution axe-core (injecté via `browser_evaluate`), extraction de l'Arbre_Accessibilité (Playwright MCP `browser_snapshot`), validation ARIA (règles axe-core + arbre a11y), simulation de navigation clavier (analyse statique + Playwright MCP `browser_press_key`), vérification des contrastes (axe-core + CSS + Playwright MCP `browser_evaluate`/`browser_hover`), analyse des documents PDF (web fetch), vérification des médias (analyse statique + Playwright MCP) et extraction de la structure des headings/landmarks (analyse statique), afin de faciliter la maintenance et l'extension.
12. LORSQUE la page contient des liens vers des documents PDF, la phase scan DOIT télécharger ces documents et vérifier s'ils sont taggés (structurés) via /MarkInfo et /StructTreeRoot, s'ils possèdent un titre (/Title) et une langue (/Lang) définis (RGAA critères 13.3, 13.4). la phase scan DOIT noter que l'analyse PDF est limitée aux vérifications structurelles et recommander PAC (PDF Accessibility Checker) pour une analyse approfondie.
13. LORSQUE la page contient des éléments vidéo ou audio, la phase scan DOIT détecter la présence de sous-titres, de transcriptions textuelles et d'audiodescription (RGAA thématique 4 — Multimédia).
14. LORSQUE la page contient des éléments vidéo, la phase scan DOIT vérifier la présence d'un mécanisme de contrôle (lecture, pause, volume) accessible au clavier.
15. la phase scan DOIT vérifier que le contenu ne force pas une orientation spécifique (portrait ou paysage) conformément au WCAG 1.3.4.
16. LORSQU'une page est analysée via URL, la phase scan DOIT capturer un screenshot pleine page (fullPage) au format PNG via Playwright MCP `browser_take_screenshot` pour fournir un contexte visuel � la phase analyse IA.
17. LORSQUE la page contient des champs de formulaire (name, email, phone, address, etc.), la phase scan DOIT vérifier la présence et la validité des attributs `autocomplete` via la règle axe-core `autocomplete-valid` (WCAG 1.3.5 / RGAA 11.13).
18. SI la capture de screenshot échoue (erreur Playwright MCP, limite mémoire), ALORS la phase scan DOIT consigner l'erreur, continuer l'audit sans screenshot et avertir la phase analyse IA de l'absence de contexte visuel.
19. SI le téléchargement d'un PDF échoue (timeout, 404, fichier trop volumineux), ALORS la phase scan DOIT consigner l'erreur avec l'URL du PDF et marquer le document comme "non vérifié" dans les résultats.
20. SI l'analyse d'un média échoue (codec non supporté, stream inaccessible), ALORS la phase scan DOIT consigner l'erreur et marquer le média comme "non vérifié" dans les résultats.
21. la phase scan DOIT extraire la hiérarchie des headings (h1-h6), les landmarks ARIA et l'outline du document par analyse statique du HTML, de manière équivalente à ce que ferait l'extension HeadingsMap.
22. LORSQU'une page est analysée via URL, la phase scan DOIT simuler la navigation clavier réelle via Playwright MCP `browser_press_key` (séquence Tab/Shift+Tab) pour capturer l'ordre de tabulation effectif, détecter les pièges clavier (éléments dont on ne peut pas sortir avec Tab/Escape) et vérifier la visibilité du focus sur chaque élément interactif (RGAA thématique 7, WCAG 2.1.1, 2.1.2, 2.4.7).
23. LORSQU'une page est analysée via URL, la phase scan DOIT tester le reflow en redimensionnant le viewport à 320px de large via Playwright MCP `browser_resize` et capturer un screenshot à cette résolution via `browser_take_screenshot` pour détecter les débordements horizontaux, les contenus tronqués et la perte d'information (WCAG 1.4.10 / RGAA 10.11).
24. LORSQU'une page est analysée via URL, la phase scan DOIT tester le zoom 200% en appliquant un facteur de zoom via Playwright MCP `browser_evaluate` (CSS `zoom: 2` ou `transform: scale(2)`) et vérifier que le contenu reste lisible et fonctionnel sans perte d'information ni chevauchement (WCAG 1.4.4 / RGAA 10.4).
25. LORSQU'une page est analysée via URL, la phase scan DOIT capturer les styles CSS réels des états interactifs (:hover, :focus) en simulant le survol via Playwright MCP `browser_hover` et le focus via `browser_click`/`browser_press_key` sur les éléments interactifs, puis extraire les couleurs foreground/background effectives via `browser_evaluate` pour validation de contraste (RGAA thématique 3, WCAG 1.4.3).
26. LORSQU'une page contient des éléments vidéo avec des contrôles, la phase scan DOIT vérifier via Playwright MCP (`browser_press_key`, `browser_snapshot`) que les contrôles sont atteignables et activables au clavier (Tab vers le contrôle, Enter/Space pour activer) (RGAA 4.13, WCAG 2.1.1).
27. SI un test dynamique Playwright MCP échoue (timeout, crash navigateur, erreur MCP), ALORS la phase scan DOIT consigner l'erreur, se rabattre sur les résultats d'analyse statique pour les critères concernés et signaler la dégradation dans les résultats.

### Exigence 3 : Mapping déterministe


**User Story :** En tant qu'auditeur accessibilité, je veux un mapper déterministe qui transforme les données brutes de la phase scan en non-conformités classifiées avec mapping WCAG vers RGAA, afin de disposer de résultats exploitables selon le référentiel français.

#### Critères d'acceptation

1. LORSQUE la phase analyse IA reçoit les résultats JSON de la phase scan, la phase analyse IA DOIT mapper chaque violation axe-core (exprimée en critères WCAG) vers le ou les critères RGAA correspondants en utilisant les champs `references.wcag` de `rgaa-criteres.json` embarqué dans les a11y-audit-assistant/references/ du skill.
2. la phase analyse IA DOIT classer chaque Non_Conformité selon trois niveaux de Sévérité : bloquante (empêche l'accès au contenu ou à une fonctionnalité), majeure (gêne significative dans l'utilisation), mineure (gêne légère sans empêcher l'accès).
3. la phase analyse IA DOIT déterminer la Sévérité en fonction de l'impact utilisateur réel, en tenant compte du type d'élément concerné, de sa position dans la page, de son rôle fonctionnel et de l'impact axe-core.
4. LORSQU'une violation WCAG correspond à un critère couvert par l'EAA, la phase analyse IA DOIT enrichir la Non_Conformité avec la référence EAA pertinente.
5. la phase analyse IA DOIT générer pour chaque Non_Conformité une suggestion de correction sous forme de code avant/après, montrant le code HTML/CSS problématique et le code corrigé.
6. LORSQUE l'Arbre_Accessibilité révèle un élément interactif sans nom accessible, la phase analyse IA DOIT créer une Non_Conformité de Sévérité majeure ou bloquante selon le type d'élément.
7. LORSQUE les résultats de navigation clavier révèlent un piège clavier, la phase analyse IA DOIT créer une Non_Conformité de Sévérité bloquante.
8. LORSQUE les résultats de navigation clavier révèlent un ordre de tabulation illogique, la phase analyse IA DOIT créer une Non_Conformité de Sévérité majeure.
9. LORSQUE les résultats de navigation clavier révèlent un élément interactif sans indicateur de focus visible, la phase analyse IA DOIT créer une Non_Conformité de Sévérité majeure.
10. LORSQUE les résultats de contraste sur états interactifs révèlent un ratio insuffisant, la phase analyse IA DOIT créer une Non_Conformité avec le ratio mesuré et le ratio attendu.
11. SI une violation axe-core ne possède pas de correspondance dans le Mapping_WCAG_RGAA, ALORS la phase analyse IA DOIT conserver la référence WCAG et signaler l'absence de mapping RGAA dans la Non_Conformité.
12. la phase analyse IA DOIT produire un ensemble structuré de Non_Conformité contenant pour chacune : le critère RGAA, le critère WCAG correspondant, la référence EAA le cas échéant, l'élément HTML en cause, la Sévérité, la description du problème, et le code avant/après correction.
13. la phase analyse IA DOIT produire ses résultats dans un format de données intermédiaire structuré et normalisé, servant de source unique de vérité pour les phases suivantes, afin de garantir la cohérence entre les livrables.
14. la phase analyse IA DOIT intégrer les résultats d'analyse des documents PDF (structure, titre, langue) dans le format intermédiaire normalisé et créer des Non_Conformité pour les PDF non accessibles.
15. la phase analyse IA DOIT intégrer les résultats d'analyse des médias (sous-titres, transcription, audiodescription, contrôles accessibles) dans le format intermédiaire normalisé et créer des Non_Conformité pour les médias non conformes.
16. la phase analyse IA DOIT intégrer les résultats de vérification d'orientation dans le format intermédiaire normalisé.
17. la phase analyse IA DOIT marquer les critères non testables automatiquement avec une explication du type de vérification manuelle ou IA requise.
18. la phase analyse IA DOIT créer des Non_Conformité pour les attributs `autocomplete` manquants ou incorrects sur les champs de formulaire (RGAA 11.13).
19. la phase analyse IA DOIT produire chaque suggestion de correction dans un format uniforme contenant : code_avant, code_apres, explication, critere_rgaa, priorite (haute, moyenne, basse selon les 3 axes de priorisation du modèle officiel RGAA : fonctionnalités essentielles, critères prioritaires bloquant l'accès, facilité de mise en œuvre).
20. la phase analyse IA DOIT détecter et signaler les erreurs critiques/évidentes avec la priorité la plus élevée : page sans attribut `<html lang>`, page sans élément `<title>`, images sans attribut `alt`, champs de formulaire sans label associé, absence de skip link / skip navigation, pièges clavier, absence de déclaration de type de document (DOCTYPE). Ces erreurs DOIVENT être marquées comme `erreur_critique: true` dans le format intermédiaire.
21. la phase analyse IA DOIT détecter les "easy wins" — corrections simples qui amélioreraient plusieurs critères à la fois (ex: ajout de l'attribut `lang` sur `<html>` corrige plusieurs critères de la thématique 8) — et les signaler dans le format intermédiaire avec la liste des critères impactés.
22. Le format intermédiaire normalisé produit par la phase analyse IA DOIT inclure un tableau `criteres_rgaa_statuts` couvrant les 106 critères RGAA, avec un statut défini pour chacun. Chaque NC dans le tableau `non_conformites` DOIT référencer un `page_id` existant dans le tableau `pages`.

### Exigence 3b : Révision sémantique IA


**User Story :** En tant qu'auditeur accessibilité, je veux que la phase analyse IA intègre un raisonnement sémantique qui enrichit les résultats du mapping déterministe par une évaluation des critères non automatisables, afin de pousser la couverture au-delà des ~57% d'axe-core.

#### Critères d'acceptation

1. LORSQUE le mapping déterministe a produit le format intermédiaire normalisé pour une page, la phase analyse IA DOIT enrichir ce format par un raisonnement sémantique, en s'appuyant sur le screenshot pleine page et le HTML/CSS de la page.
2. la phase analyse IA DOIT effectuer un raisonnement sémantique IA sur les critères non automatisables suivants :
   - Pertinence des alternatives textuelles des images (RGAA thématique 1)
   - Pertinence du titre du cadre (RGAA thématique 2)
   - Information véhiculée uniquement par la couleur (ex: champ en rouge sans texte d'erreur) (RGAA thématique 3)
   - Cohérence de la hiérarchie des headings h1-h6 (RGAA thématique 9)
   - Clarté et explicité des labels de formulaires (RGAA thématique 11)
   - Structure correcte des tableaux de données (headers, scope, caption) (RGAA thématique 5)
   - Présence correcte des attributs de langue (lang sur html, changements de langue dans le contenu) (RGAA thématique 8)
   - Pertinence des intitulés de liens (RGAA thématique 6)
   - Cohérence de la navigation entre les pages (RGAA thématique 12)
   - Lisibilité, espacement, zoom 200%, contenu masqué ignoré par les technologies d'assistance (RGAA thématique 10)
3. LORSQUE la phase analyse IA détecte une Non_Conformité potentielle, il DOIT la marquer avec la source "analyse-ia" et indiquer un niveau de confiance (élevé, moyen, faible) pour distinguer ces résultats de ceux issus des outils automatisés.
4. La phase analyse IA DOIT enrichir le format intermédiaire normalisé avec ses NC supplémentaires.
5. Le screenshot pleine page DOIT servir de contexte visuel � la phase analyse IA pour évaluer la mise en page, les couleurs, la lisibilité, le contexte des images et la hiérarchie visuelle.
6. la phase analyse IA DOIT évaluer la pertinence des valeurs `autocomplete` sur les champs de formulaire par rapport au contexte du champ (ex: un champ "Prénom" devrait avoir `autocomplete="given-name"`) (RGAA 11.13).
7. Le seuil de confiance du Semantic Reviewer DOIT être configurable via les options d'audit (`seuil_confiance`, défaut : `"moyen"`). Les NC dont le niveau de confiance est inférieur au seuil configuré DOIVENT être marquées comme nécessitant une validation humaine.
8. Chaque NC produite par le Semantic Reviewer DOIT inclure un champ `justification` expliquant le raisonnement IA ayant conduit à la détection de la NC.

### Exigence 4 : Rapport Markdown


**User Story :** En tant qu'auditeur accessibilité, je veux un rapport Markdown complet et structuré selon le modèle officiel de rapport d'audit RGAA (DINUM, licence ouverte 2.0), afin de disposer d'un livrable conforme aux standards français avec le détail de chaque non-conformité.

#### Critères d'acceptation

1. la phase rapports DOIT produire un rapport structuré conformément au modèle officiel de rapport d'audit RGAA (DINUM, licence ouverte 2.0) :
   - **Introduction > Contexte** : périmètre de l'audit, méthode utilisée, liste des pages auditées, version RGAA, technologies utilisées sur le site, outils d'audit avec versions, environnement de test
   - **Introduction > Accessibilité du site** : niveau d'accessibilité global, Taux_Conformité (pourcentage de critères respectés), vue d'ensemble qualitative, principaux points forts et points faibles
   - **Description des erreurs d'accessibilité** : organisée par les 13 thématiques RGAA (Images, Cadres, Couleurs, Multimédia, Tableaux, Liens, Scripts, Éléments obligatoires, Structuration, Présentation, Formulaires, Navigation, Consultation), chaque thématique avec un texte introductif puis les NC détaillées avec description du problème et recommandation technique
   - **Conclusion > Avis** : avis général de l'auditeur, points forts du site
   - **Conclusion > Priorisation des corrections** : selon 3 axes (fonctionnalités essentielles/contenu, critères prioritaires bloquant l'accès, facilité de mise en œuvre)
   - **Annexes** : critères couverts automatiquement, critères évalués par le Semantic Reviewer IA, critères nécessitant une revue manuelle, mention que la grille d'audit Excel est annexée
2. Le rapport DOIT mentionner que la grille d'audit Excel est annexée.
3. La section Introduction DOIT mentionner explicitement qu'Axe_Core ne couvre qu'environ 57% des critères WCAG de manière automatisée et que les résultats ne constituent pas un audit complet.
4. la phase rapports DOIT produire un tableau récapitulatif des Page_Auditée avec les colonnes : identifiant (ex: p01), nom (ex: accueil), URL, nombre de Non_Conformité par Sévérité (bloquante, majeure, mineure).
5. la phase rapports DOIT calculer et afficher le Taux_Conformité RGAA (nombre de critères conformes / nombre de critères applicables × 100) dans la section Accessibilité du site.
6. la phase rapports DOIT produire le détail de chaque Non_Conformité dans le format uniforme de recommandation (critère RGAA/WCAG, sévérité, problème, code avant/après, explication, priorité selon les 3 axes).
7. la phase rapports DOIT identifier les critères RGAA nécessitant une revue manuelle et les lister dans une section dédiée avec la mention "revue manuelle nécessaire".
8. LORSQUE la phase scan a échoué sur une ou plusieurs Page_Auditée, la phase rapports DOIT mentionner ces échecs dans la section Introduction avec les URLs concernées.
9. Les rapports par page DOIVENT suivre la même structure que le rapport global mais limités au périmètre de la page concernée.
10. Les erreurs critiques (Erreur_Critique) DOIVENT être mises en évidence de manière proéminente dans le rapport, dans une sous-section dédiée en début de la section Description des erreurs.

### Exigence 5 : Grille RGAA Excel


**User Story :** En tant qu'auditeur accessibilité, je veux une grille d'audit RGAA au format Excel conforme au modèle officiel ODS, afin de disposer d'un livrable exploitable pour la déclaration de conformité.

#### Critères d'acceptation

1. la phase rapports DOIT reproduire la structure de la Grille_RGAA_Officielle au format .xlsx, avec une feuille par page auditée (P01, P02, etc.) et 7 colonnes : Thématique, Critère, Recommandation, Statut (C/NC/NA/NT), Dérogation (N/O), Modifications à apporter, Commentaires.
2. LORSQUE les données analysées sont reçues, la phase rapports DOIT remplir la grille avec le statut de chaque critère RGAA : C (conforme), NC (non conforme), NA (non applicable), NT (non testé).
3. LORSQU'un critère RGAA est non conforme, la phase rapports DOIT inclure les observations associées dans la colonne "Modifications à apporter" décrivant la Non_Conformité détectée.
4. Les critères et les commentaires présents dans la Grille_RGAA_Excel DOIVENT être identiques à ceux du rapport Markdown produit par la phase rapports.
5. LORSQU'un critère RGAA n'a pas pu être testé automatiquement, la phase rapports DOIT indiquer le statut NT (non testé) pour ce critère.
6. La Grille_RGAA_Excel DOIT être générée au format .xlsx.
7. SI la Grille_RGAA_Officielle (fichier ODS `rgaa4.1.2.modele-de-grille-d-audit.ods`) est fournie dans les a11y-audit-assistant/references/ du skill, ALORS le script Node.js PEUT l'utiliser comme référence pour le formatage.
8. SI la Grille_RGAA_Officielle n'est pas disponible dans les a11y-audit-assistant/references/, ALORS la phase rapports DOIT générer la grille à partir de la structure des 106 critères RGAA embarquée dans le système.
9. la phase rapports DOIT produire un fichier JSON d'instructions de remplissage de la grille (`grille-instructions.json`), qui sera consommé par le script Node.js `a11y-audit-assistant/scripts/generate-xlsx.mjs` pour générer le fichier .xlsx final.
10. L'en-tête de chaque feuille DOIT contenir "RGAA {version} – GRILLE D'ÉVALUATION" suivi du nom et de l'URL de la page auditée.

### Exigence 6 : Limitations et revue manuelle

**User Story :** En tant qu'auditeur accessibilité, je veux que le système documente explicitement ses limitations et identifie les critères nécessitant une revue manuelle, afin de ne pas surestimer la couverture de l'audit automatisé.

#### Critères d'acceptation

1. L'agent DOIT maintenir une liste des critères RGAA couverts par l'analyse automatisée et une liste des critères nécessitant une revue manuelle.
2. Les critères nécessitant un jugement humain (pertinence des alternatives textuelles, clarté du langage, cohérence de navigation entre les pages) DOIVENT être signalés avec la mention "revue manuelle nécessaire" dans le rapport Markdown et dans la Grille_RGAA_Excel.
3. Le rapport Markdown DOIT mentionner explicitement qu'Axe_Core ne couvre qu'environ 57% des critères WCAG de manière automatisée.
4. LORSQUE l'Arbre_Accessibilité est utilisé pour détecter des problèmes supplémentaires (rôles ARIA mal implémentés, noms accessibles manquants), le rapport Markdown DOIT mentionner cette source de données et sa valeur ajoutée par rapport à l'analyse du DOM seul.
5. Le rapport Markdown DOIT distinguer clairement les Non_Conformité détectées automatiquement, celles issues du raisonnement IA (avec leur niveau de confiance), et celles nécessitant une validation humaine.
6. LORSQU'un critère RGAA ne peut être évalué ni automatiquement ni par analyse de l'Arbre_Accessibilité ni par la phase analyse IA, la phase analyse IA DOIT le marquer comme "non testable automatiquement" avec une explication du type de vérification manuelle requise.

### Exigence 7 : Analyse statique HTML/CSS

**User Story :** En tant qu'auditeur accessibilité, je veux pouvoir soumettre du code HTML et/ou CSS directement au système sans URL, afin de pouvoir auditer des composants en cours de développement ou des pages non encore déployées.

#### Critères d'acceptation

1. LORSQUE l'utilisateur fournit du code HTML et/ou CSS directement (mode sans URL), la phase scan DOIT charger le code via `browser_navigate` vers une data URL, puis injecter axe-core via `browser_evaluate` et exécuter `axe.run()` pour l'analyse.
2. LORSQUE le mode sans URL est utilisé, la phase scan DOIT utiliser `browser_navigate` vers une data URL puis injection axe-core via `browser_evaluate` pour l'analyse axe-core sur le HTML fourni.
3. LORSQUE le mode sans URL est utilisé, la phase scan DOIT valider les attributs ARIA via les règles ARIA d'axe-core injecté. L'extraction de l'Arbre_Accessibilité (Playwright MCP `browser_snapshot`) n'est pas disponible en mode sans URL.
4. LORSQUE l'analyse est effectuée en mode sans URL, la phase rapports DOIT mentionner dans la section Introduction que l'analyse a été réalisée sur du code fourni directement et indiquer les limitations associées (absence de JavaScript dynamique, absence de ressources externes).
5. SI le code HTML fourni ne contient pas de balise DOCTYPE ou de structure HTML valide, ALORS la phase scan DOIT avertir l'utilisateur et tenter l'analyse sur le code tel que fourni.
6. LORSQUE le code HTML fourni référence des ressources externes (feuilles CSS, scripts JS, images), la phase scan DOIT tenter de les résoudre si elles sont accessibles, et consigner dans les résultats les ressources non résolues avec leur impact potentiel sur l'analyse.
7. LORSQUE des ressources externes ne peuvent pas être résolues en mode sans URL, la phase rapports DOIT lister ces ressources manquantes dans la section Introduction et indiquer les critères d'accessibilité potentiellement affectés (contrastes, images, etc.).

### Exigence 8 : Données de référence

**User Story :** En tant qu'auditeur accessibilité, je veux que le système embarque les données de référence nécessaires (mapping WCAG↔RGAA, grille ODS officielle, référentiels), afin de garantir des résultats fiables et conformes aux standards en vigueur.

#### Critères d'acceptation

1. Le fichier `rgaa-criteres.json` (généré par `npm run update-refs`) DOIT contenir les références WCAG par critère RGAA dans le champ `references.wcag`, servant de base au mapping WCAG → RGAA effectué par la phase analyse IA.
2. Le mapping WCAG → RGAA DOIT couvrir la correspondance entre chaque critère de succès WCAG (niveaux A et AA) et les 106 critères RGAA, telle que définie par la DINUM dans les données RGAA.
3. La Grille_RGAA_Officielle au format ODS (`rgaa4.1.2.modele-de-grille-d-audit.ods`) DOIT être disponible dans le répertoire a11y-audit-assistant/references/ du skill ou être téléchargeable depuis le site officiel du RGAA.
4. Les référentiels RGAA, WCAG et EAA DOIVENT être embarqués dans le répertoire a11y-audit-assistant/references/ du skill avec leur numéro de version.
5. LORSQU'un référentiel embarqué est mis à jour, le numéro de version DOIT être mis à jour dans les métadonnées du skill.
6. SI le Mapping_WCAG_RGAA ne couvre pas un critère WCAG détecté par Axe_Core, ALORS la phase analyse IA DOIT signaler le critère manquant dans les résultats et dans le rapport Markdown.
7. Le fichier de configuration des références (`a11y-audit-assistant/scripts/references-config.json`) DOIT inclure pour chaque référentiel les champs `source`, `version`, `repository` et `url` pointant vers la source officielle, afin de permettre la vérification des mises à jour. Les liens EAA DOIVENT utiliser les liens ELI stables : `https://eur-lex.europa.eu/eli/dir/2019/882/oj` (URI ELI stable).
8. Le skill DOIT fournir un script Node.js (`a11y-audit-assistant/scripts/update-references.mjs`) permettant de télécharger et mettre à jour les fichiers de référence depuis les dépôts GitHub officiels. Le script est exécutable via `npm run update-refs`.
9. LORSQUE le script de mise à jour est exécuté, il DOIT télécharger les données depuis les sources configurées dans `a11y-audit-assistant/scripts/references-config.json` et écrire les fichiers JSON dans `a11y-audit-assistant/references/` avec un header `meta` unifié (source, version, repository, url, generatedAt).
10. La configuration du script (versions, branches, listes de fichiers, listes de patterns) DOIT être externalisée dans `a11y-audit-assistant/scripts/references-config.json` afin qu'aucune modification de code ne soit nécessaire lors d'une mise à jour de version.
11. Le script DOIT gérer le rate limiting GitHub (retry avec backoff) et les erreurs réseau gracieusement.
12. Le template de grille d'audit (`rgaa4.1.2.modele-de-grille-d-audit.ods`) DOIT être ajouté manuellement par le développeur. Les fichiers JSON de référence sont générés par le script `update-references.mjs`. SI les fichiers de référence JSON (`rgaa-criteres.json`, `wcag-sc.json`, `aria-patterns.json`) sont absents, l'agent DOIT interrompre l'audit et afficher la commande `npm run update-refs`. SI le template ODS est absent, l'agent DOIT demander le consentement explicite de l'utilisateur avant de continuer avec une grille générée sans formatage officiel.
13. Les fichiers de référence générés DOIVENT inclure : `a11y-audit-assistant/references/rgaa-criteres.json` (critères RGAA), `a11y-audit-assistant/references/rgaa-glossaire.json` (glossaire RGAA), `a11y-audit-assistant/references/wcag-sc.json` (critères WCAG A/AA/AAA), `a11y-audit-assistant/references/aria-patterns.json` (patterns WAI-ARIA APG avec interactions clavier et propriétés ARIA). Le template ODS DOIT être obtenu depuis le site officiel du RGAA et placé manuellement dans `a11y-audit-assistant/references/`.

### Exigence 9 : Structure du workspace d'audit

**User Story :** En tant qu'auditeur accessibilité, je veux que chaque audit produise un répertoire de travail structuré avec un sous-répertoire par page auditée contenant la source et un rapport Markdown spécifique, afin de pouvoir consulter les résultats page par page de manière organisée.

#### Critères d'acceptation

1. LORSQU'un audit est initié, l'agent DOIT créer un répertoire de travail dédié à l'audit en cours dans le workspace.
2. Le répertoire de travail DOIT contenir un sous-répertoire par Page_Auditée, nommé selon l'identifiant et le nom de la page (ex: `p01-accueil/`).
3. Chaque sous-répertoire de page DOIT contenir le code source HTML capturé de la page auditée.
4. Chaque sous-répertoire de page DOIT contenir un fichier Markdown listant les Non_Conformité spécifiques à cette page, avec le même niveau de détail que dans le rapport global (critère RGAA, critère WCAG, sévérité, description, code avant/après).
5. Le rapport Markdown par page DOIT être cohérent avec le rapport global : les Non_Conformité listées dans le rapport par page DOIVENT correspondre exactement à celles de la même page dans le rapport global.
6. LORSQUE le mode sans URL est utilisé avec un seul code HTML fourni, le répertoire de travail DOIT tout de même contenir un sous-répertoire pour cette page avec la source et le rapport Markdown associé.
7. Chaque sous-répertoire de page DOIT contenir le screenshot pleine page (capture.png) de la page auditée.

### Exigence 10 : Outillage

**User Story :** En tant que développeur du skill, je veux que l'outillage soit entièrement basé sur Node.js et Playwright MCP, afin de simplifier les prérequis et garantir la portabilité.

#### Critères d'acceptation

1. La génération de fichiers Excel (.xlsx) DOIT utiliser le script Node.js `a11y-audit-assistant/scripts/generate-xlsx.mjs` avec la bibliothèque `exceljs`.
2. Le template de grille d'audit ODS (`rgaa4.1.2.modele-de-grille-d-audit.ods`) PEUT être utilisé comme référence pour le formatage. Si absent, la grille est générée à partir de la structure des 106 critères RGAA.
3. Le serveur MCP unique est Playwright MCP, qui fournit tous les outils d'interaction navigateur. axe-core est injecté dynamiquement via `browser_evaluate` (chargement CDN puis `axe.run()`).
4. Les dépendances Node.js DOIVENT être gérées via npm avec un fichier `package.json` à la racine du projet.
5. La mise à jour des fichiers de référence DOIT utiliser le script Node.js `a11y-audit-assistant/scripts/update-references.mjs` avec la configuration externalisée dans `a11y-audit-assistant/scripts/references-config.json`. Le script est exécutable via `npm run update-refs`.
6. Le skill DOIT inclure un script Node.js `a11y-audit-assistant/scripts/generate-xlsx.mjs` qui consomme le fichier JSON d'instructions produit par la phase rapports et génère le fichier .xlsx final via exceljs. Le script valide la structure du JSON (106 critères, statuts valides) avant génération.
7. Le skill DOIT inclure un script Node.js `a11y-audit-assistant/scripts/check-deps.mjs` (exécutable via `npm run check-deps`) permettant aux utilisateurs de vérifier tous les prérequis du skill avant le premier audit. Le script DOIT vérifier : Node.js, MCP Playwright, fichiers de référence JSON, exceljs, template ODS, eaa-references.json, espace disque. Le script DOIT afficher un résumé clair avec le statut de chaque composant (✓/✗/⚠).
8. Le `package.json` DOIT inclure les scripts npm suivants : `update-refs` (mise à jour des références), `check-deps` (vérification des prérequis).

### Exigence 11 : Steering files et règles de développement

**User Story :** En tant que développeur du skill, je veux que le skill dispose de fichiers steering dédiés dans .kiro/steering/, afin de garantir que Kiro applique systématiquement les règles d'accessibilité, les patterns d'analyse et les standards de qualité lors de toute modification ou extension du skill.

#### Critères d'acceptation

1. Le skill DOIT disposer de fichiers steering dans .kiro/steering/ définissant les règles de développement spécifiques au domaine de l'accessibilité.
2. Les fichiers steering DOIVENT inclure au minimum : les conventions de nommage des agents, les patterns de communication inter-agents, les formats de données échangées (JSON structuré), et les règles de classification des Non_Conformité.
3. LORSQU'une nouvelle fonctionnalité transversale est ajoutée au skill (ex: nouveau type d'analyse, nouveau référentiel), les fichiers steering DOIVENT être mis à jour pour intégrer cette fonctionnalité de manière cohérente.
4. Les fichiers steering DOIVENT être vérifiés pour leur alignement avec les exigences et le design avant toute exécution de tâches.
5. LORSQU'un artefact de spécification est créé ou modifié (requirements.md, design.md, tasks.md), l'agent DOIT vérifier explicitement la conformité de l'artefact avec les steering files existants.

### Exigence 12 : Qualité et complétude (Quality-First)

**User Story :** En tant que développeur du skill, je veux qu'une règle Quality-First soit appliquée systématiquement, afin de garantir que chaque implémentation soit la plus propre et maintenable possible, sans compromis de qualité.

#### Critères d'acceptation

1. Le skill DOIT disposer d'un fichier steering "quality-first" dans .kiro/steering/ imposant des contraintes de qualité et de complétude.
2. La règle Quality-First DOIT interdire tout compromis de qualité : aucun code mort, aucun code commenté, aucun TODO hack, aucun contournement de test.
3. SI un compromis semble inévitable pendant le développement, ALORS l'agent DOIT s'arrêter et demander une validation explicite à l'utilisateur avant de poursuivre.
4. Chaque agent du skill DOIT disposer d'une gestion d'erreurs complète et d'une validation des entrées/sorties.
5. Les rapports générés (Markdown et Excel) DOIVENT être vérifiés pour leur cohérence mutuelle après génération et avant livraison à l'utilisateur. l'agent DOIT comparer les statuts et observations de chaque critère RGAA entre le rapport Markdown et le fichier JSON d'instructions Excel, critère par critère et page par page, et signaler toute divergence.

### Exigence 13 : Exigences transversales et références globales

**User Story :** En tant que développeur du skill, je veux que les exigences transversales de l'organisation soient référencées et respectées par le skill, afin de garantir la cohérence avec les standards de 74Software.

#### Critères d'acceptation

1. SI un fichier d'exigences globales existe dans .kiro/specs/ (ex: global-requirements.md), ALORS le skill DOIT le référencer en en-tête du requirements.md via la syntaxe #[[file:.kiro/specs/global-requirements.md]].
2. Les exigences transversales de l'organisation (sécurité, qualité, conventions) DOIVENT être respectées par tous les agents du skill.
3. LORSQUE de nouvelles exigences transversales sont ajoutées au niveau de l'organisation, le skill DOIT être vérifié pour sa conformité avec ces nouvelles exigences.
4. La vérification de cohérence croisée entre requirements.md, design.md et tasks.md DOIT être effectuée avant le lancement de l'exécution des tâches, conformément aux recommandations 74Software.

### Exigence 14 : Vérification des prérequis

**User Story :** En tant qu'auditeur accessibilité, je veux que l'agent vérifie la disponibilité des prérequis techniques avant de lancer un audit, afin d'éviter des échecs en cours d'exécution et de proposer des solutions en cas de prérequis manquant.

#### Critères d'acceptation

1. AVANT de lancer un audit, l'agent DOIT vérifier la disponibilité des prérequis suivants : Node.js (via `node --version`), serveur MCP Playwright (configuré et accessible), exceljs (via `node -e "require('exceljs')"`), template de grille d'audit ODS dans a11y-audit-assistant/references/, fichiers de référence JSON dans a11y-audit-assistant/references/.
2. SI Node.js n'est pas installé, ALORS l'agent DOIT signaler l'erreur avec la commande d'installation et interrompre l'audit. Node.js est indispensable.
3. SI le serveur MCP Playwright n'est pas configuré ou accessible, ALORS l'agent DOIT signaler l'erreur avec les instructions de configuration et interrompre l'audit. Playwright MCP est indispensable (serveur MCP unique, nécessaire pour l'injection axe-core via `browser_evaluate` et tous les tests dynamiques).
4. SI exceljs n'est pas installé, ALORS l'agent DOIT l'installer automatiquement via `npm install exceljs` et retenter.
5. SI le template de grille d'audit ODS (`rgaa4.1.2.modele-de-grille-d-audit.ods`) est absent de a11y-audit-assistant/references/, ALORS l'agent DOIT signaler que la grille Excel sera générée à partir de `rgaa-criteres.json` (structure correcte mais sans le formatage officiel DINUM), et demander le consentement explicite de l'utilisateur pour continuer. SI l'utilisateur refuse, l'audit DOIT être interrompu.
6. SI les fichiers de référence JSON (`rgaa-criteres.json`, `wcag-sc.json`, `aria-patterns.json`) sont absents de a11y-audit-assistant/references/, ALORS l'agent DOIT signaler l'erreur avec la commande de génération (`npm run update-refs`) et interrompre l'audit. Ces fichiers sont indispensables.
7. L'agent DOIT lister tous les prérequis manquants avec les commandes d'installation et les fonctionnalités impactées.
8. L'agent DOIT afficher un résumé clair des prérequis vérifiés avec le statut de chaque composant (✓ disponible / ✗ manquant / ⚠ manquant avec consentement requis) avant de lancer l'audit.
9. L'audit NE DOIT PAS démarrer tant que tous les prérequis bloquants sont absents ou que l'utilisateur n'a pas donné son consentement explicite pour chaque prérequis non bloquant manquant.

### Exigence 15 : Gestion des erreurs avancée

**User Story :** En tant qu'auditeur accessibilité, je veux que le système gère gracieusement les erreurs inattendues pendant l'audit, afin de maximiser les résultats même en cas de problèmes techniques.

#### Critères d'acceptation

1. SI le serveur MCP Playwright se déconnecte en cours d'audit, ALORS l'agent DOIT tenter une reconnexion. SI la reconnexion échoue, l'agent DOIT consigner l'erreur et arrêter l'audit proprement.
2. AVANT de commencer l'audit, l'agent DOIT vérifier l'espace disque disponible pour le workspace d'audit. SI l'espace disponible est inférieur à 100 Mo, l'agent DOIT avertir l'utilisateur.
3. SI le script `generate-xlsx.mjs` échoue, ALORS l'audit DOIT tout de même produire le rapport Markdown et le fichier JSON d'instructions (`grille-instructions.json`), et signaler l'échec de la génération Excel à l'utilisateur.
4. SI la phase analyse IA échoue (timeout LLM, erreur de parsing), ALORS l'agent DOIT livrer le format intermédiaire de la phase analyse IA sans enrichissement IA, en avertissant l'utilisateur que les critères non automatisables n'ont pas été évalués.
5. SI le fichier `a11y-audit-assistant/references/eaa-references.json` est absent, ALORS la phase analyse IA DOIT omettre l'enrichissement EAA et avertir l'utilisateur. L'audit continue normalement.
6. SI l'espace disque devient insuffisant en cours d'audit, ALORS l'agent DOIT arrêter proprement et livrer les résultats déjà produits (pages déjà analysées).
7. SI axe-core retourne 0 violations sur une page, ALORS l'agent DOIT avertir l'utilisateur (résultat inhabituel pouvant indiquer un problème de chargement ou une page vide).
8. AVANT d'appeler le script `generate-xlsx.mjs`, l'agent DOIT valider le JSON `grille-instructions.json` (structure, 106 critères, statuts valides) pour détecter les erreurs avant la génération Excel.


