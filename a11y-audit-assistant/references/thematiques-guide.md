# Guide détaillé par thématique RGAA — Phase 3 (Analyse IA)

Ce fichier est la référence opérationnelle pour la phase 3 de l'audit. Pour chaque thématique RGAA, il précise :
- Les éléments HTML à chercher dans le DOM
- Les fichiers de référence à consulter
- Les résultats axe-core à croiser
- Les vérifications IA au-delà de l'automatisation
- Les patterns ARIA applicables (depuis `aria-patterns.json`)

## Utilisation

L'agent DOIT lire ce fichier au début de la phase 3, puis pour chaque thématique :
1. Extraire les éléments HTML listés ci-dessous depuis le DOM (source.html ou `browser_evaluate`)
2. Croiser avec les résultats axe-core de la phase 2 (règles listées par thématique)
3. Consulter `mapping-rgaa-wcag-eaa.json` pour les correspondances WCAG/EAA de chaque critère
4. Appliquer les vérifications IA spécifiques listées ci-dessous
5. Pour les composants interactifs, ouvrir `aria-patterns.json` et vérifier le pattern correspondant

---

## Thématique 1 — Images (critères 1.1 à 1.9)

### Éléments HTML à chercher
`<img>`, `<svg>`, `<canvas>`, `<area>`, `<input type="image">`, `[role="img"]`, images CSS `background-image` sur éléments porteurs de contenu.

### Règles axe-core à croiser
`image-alt`, `input-image-alt`, `area-alt`, `svg-img-alt`, `role-img-alt`, `image-redundant-alt`

### Vérifications IA (au-delà d'axe-core)
- **1.1** : Vérifier que chaque image porteuse d'information a un `alt` non vide ET pertinent (pas juste "image", "photo", "logo")
- **1.2** : Images décoratives : vérifier `alt=""` ou `role="presentation"` ou `aria-hidden="true"`. Si l'image est dans un `<a>`, le lien doit avoir un intitulé par ailleurs
- **1.3** : Pertinence de l'alternative — l'IA doit juger si le `alt` décrit correctement le contenu visuel (NT si jugement subjectif)
- **1.6/1.7** : Images porteuses d'information complexe (graphiques, schémas) — vérifier présence d'une description détaillée (`longdesc`, `aria-describedby`, texte adjacent)
- **1.8/1.9** : Images texte — vérifier si le texte pourrait être en HTML plutôt qu'en image

### Patterns ARIA applicables
Aucun pattern spécifique. Vérifier `role="img"` + `aria-label` ou `aria-labelledby`.

---

## Thématique 2 — Cadres (critères 2.1 à 2.2)

### Éléments HTML à chercher
`<iframe>`, `<frame>`, `<object>`, `<embed>`

### Règles axe-core à croiser
`frame-title`, `frame-title-unique`

### Vérifications IA
- **2.1** : Chaque `<iframe>` a un attribut `title` non vide
- **2.2** : Le `title` est pertinent (décrit le contenu du cadre, pas juste "iframe")

### Patterns ARIA applicables
Aucun pattern spécifique.

---

## Thématique 3 — Couleurs (critères 3.1 à 3.3)

### Éléments HTML à chercher
Tous les éléments textuels, `<a>`, `<button>`, champs de formulaire, icônes, bordures de composants UI.

### Règles axe-core à croiser
`color-contrast`, `color-contrast-enhanced`, `link-in-text-block`

### Vérifications IA
- **3.1** : Information transmise uniquement par la couleur — chercher : liens non soulignés dans du texte, champs en erreur signalés uniquement par la couleur rouge, graphiques sans légende textuelle, onglets actifs distingués uniquement par couleur
- **3.2** : Contraste texte ≥ 4.5:1 (texte normal) ou ≥ 3:1 (grand texte ≥ 24px ou ≥ 18.5px bold). Croiser avec `contrastes` de la phase 2. Vérifier aussi les états `:hover` et `:focus`
- **3.3** : Contraste des composants d'interface et objets graphiques ≥ 3:1 (bordures de champs, icônes fonctionnelles, indicateurs de focus)

### Patterns ARIA applicables
Aucun pattern spécifique. Vérifier les indicateurs visuels des états ARIA (`aria-selected`, `aria-current`, `aria-checked`).

---

## Thématique 4 — Multimédia (critères 4.1 à 4.13)

### Éléments HTML à chercher
`<video>`, `<audio>`, `<track>`, `<source>`, `<object>` (Flash/embed), `[role="application"]` contenant des médias, players tiers (YouTube, Vimeo, Dailymotion via `<iframe>`).

### Règles axe-core à croiser
`video-caption`, `audio-caption`, `no-autoplay-audio`

### Vérifications IA
- **4.1** : Chaque média temporel pré-enregistré a une transcription textuelle ou une audiodescription
- **4.3/4.4** : Sous-titres synchronisés présents et pertinents (vérifier `<track kind="captions">`)
- **4.5/4.6** : Audiodescription si information visuelle non transmise par la bande son
- **4.7** : Pas de démarrage automatique du son (ou contrôle pour l'arrêter)
- **4.10/4.11** : Contrôles du lecteur accessibles (play, pause, volume, sous-titres)
- **4.13** : Contrôles atteignables et activables au clavier — croiser avec `controles_video_clavier` de la phase 2
- Si aucun élément média trouvé → tous les critères 4.x = NA

### Patterns ARIA applicables
Aucun pattern standard. Vérifier les contrôles custom : `role="slider"` pour volume/progression, boutons avec `aria-label`.

---

## Thématique 5 — Tableaux (critères 5.1 à 5.8)

### Éléments HTML à chercher
`<table>`, `<th>`, `<td>`, `<caption>`, `<thead>`, `<tbody>`, `<tfoot>`, `[role="table"]`, `[role="grid"]`, `[role="row"]`, `[role="cell"]`, `[role="columnheader"]`, `[role="rowheader"]`.

### Règles axe-core à croiser
`td-headers-attr`, `th-has-data-cells`, `table-fake-caption`, `scope-attr-valid`, `table-duplicate-name`

### Vérifications IA
- **5.1** : Tableaux de données complexes — vérifier `<caption>` ou `aria-label`/`aria-labelledby`
- **5.3** : Tableaux de mise en page — vérifier `role="presentation"` ou `role="none"`, pas de `<th>`, `<caption>`, `scope`, `headers`
- **5.6/5.7** : En-têtes `<th>` avec `scope="col"` ou `scope="row"`, ou `headers`/`id` pour tableaux complexes
- **5.8** : Chaque `<td>` de données est associé à au moins un `<th>`

### Patterns ARIA applicables
Consulter `aria-patterns.json` → patterns `table` et `grid`. Vérifier les rôles ARIA si tableau custom.

---

## Thématique 6 — Liens (critères 6.1 à 6.2)

### Éléments HTML à chercher
`<a>`, `<area>`, `[role="link"]`, liens avec `aria-label`, `aria-labelledby`, `title`.

### Règles axe-core à croiser
`link-name`, `identical-links-same-purpose`

### Vérifications IA
- **6.1** : Chaque lien a un intitulé accessible (texte visible, `aria-label`, `aria-labelledby`, `title`, ou contenu d'une `<img alt>` enfant). Pas d'intitulé vide
- **6.2** : L'intitulé est explicite hors contexte — l'IA doit juger si "cliquez ici", "en savoir plus", "lire la suite" sont suffisamment explicites. Vérifier le contexte (`<p>`, `<li>`, `<td>`, heading parent) si l'intitulé seul est ambigu

### Patterns ARIA applicables
Consulter `aria-patterns.json` → pattern `link`.

---

## Thématique 7 — Scripts (critères 7.1 à 7.5)

### Éléments HTML à chercher
Tous les éléments avec `role` ARIA explicite, `[tabindex]`, `[onclick]`, `[onkeydown]`, `[onkeypress]`, composants custom (menus, onglets, modales, accordéons, combobox, sliders, tooltips, treeviews, etc.), `[aria-live]`, `[role="alert"]`, `[role="status"]`, `[role="log"]`.

### Règles axe-core à croiser
`aria-allowed-attr`, `aria-allowed-role`, `aria-command-name`, `aria-dialog-name`, `aria-hidden-body`, `aria-hidden-focus`, `aria-input-field-name`, `aria-meter-name`, `aria-progressbar-name`, `aria-required-attr`, `aria-required-children`, `aria-required-parent`, `aria-roledescription`, `aria-roles`, `aria-toggle-field-name`, `aria-tooltip-name`, `aria-valid-attr`, `aria-valid-attr-value`, `nested-interactive`, `scrollable-region-focusable`

### Vérifications IA — CRITIQUE : utiliser aria-patterns.json
Pour chaque composant interactif détecté :
1. Identifier le pattern ARIA correspondant dans `aria-patterns.json`
2. Vérifier les `keyboardInteraction` du pattern : chaque touche documentée doit fonctionner (croiser avec `navigation_clavier.tests_dynamiques` de la phase 2)
3. Vérifier les `ariaRolesStatesProperties` du pattern : chaque attribut ARIA requis doit être présent et correct

Vérifications spécifiques :
- **7.1** : Chaque script a une alternative compatible avec les technologies d'assistance, OU le composant ARIA est correctement implémenté selon le pattern APG
- **7.2** : Chaque composant interactif est utilisable au clavier (Tab, Entrée, Espace, Échap, flèches selon le pattern)
- **7.3** : Pas de changement de contexte inattendu au focus ou à la saisie
- **7.4** : Changements de contexte initiés par l'utilisateur sont réversibles ou signalés
- **7.5** : Messages de statut (`role="status"`, `role="alert"`, `aria-live`) sont correctement implémentés

### Patterns ARIA à vérifier systématiquement
Ouvrir `aria-patterns.json` et chercher les patterns correspondant aux composants détectés :
| Composant détecté | Pattern aria-patterns.json |
|---|---|
| Menu/menubar | `menubar` |
| Onglets | `tabs` |
| Accordéon | `accordion` |
| Modale/dialog | `dialog-modal` |
| Combobox/autocomplete | `combobox` |
| Slider/range | `slider` |
| Checkbox custom | `checkbox` |
| Radio custom | `radio` |
| Switch/toggle | `switch` |
| Tooltip | `tooltip` |
| Treeview | `treeview` |
| Listbox | `listbox` |
| Disclosure (show/hide) | `disclosure` |
| Carousel | `carousel` |
| Toolbar | `toolbar` |
| Alert | `alert` |
| Breadcrumb | `breadcrumb` |

---

## Thématique 8 — Éléments obligatoires (critères 8.1 à 8.10)

### Éléments HTML à chercher
`<!DOCTYPE>`, `<html lang>`, `<title>`, `<meta charset>`, balises ouvrantes/fermantes, `[lang]` sur éléments internes, `[dir]`.

### Règles axe-core à croiser
`document-title`, `html-has-lang`, `html-lang-valid`, `html-xml-lang-equivalent`, `valid-lang`, `bypass`, `meta-viewport`

### Vérifications IA
- **8.1** : `<!DOCTYPE html>` présent en première ligne
- **8.2** : `<html lang="xx">` présent et valide (code ISO 639-1)
- **8.3** : `<title>` présent, non vide, pertinent (pas juste "Accueil" ou le nom du CMS)
- **8.4** : Cohérence entre `lang` déclaré et langue réelle du contenu — l'IA doit lire le contenu textuel et vérifier
- **8.7/8.8** : Changements de langue dans le contenu — chercher des passages en langue étrangère sans `lang="xx"` sur l'élément parent
- **8.9** : Balises HTML utilisées conformément à leur sémantique (pas de `<div>` cliquable sans `role="button"`, pas de `<table>` pour la mise en page sans `role="presentation"`)
- **8.10** : Pas de changement de sens de lecture non signalé (`dir="rtl"` si contenu en arabe/hébreu)

### Patterns ARIA applicables
Aucun pattern spécifique.

---

## Thématique 9 — Structuration (critères 9.1 à 9.4)

### Éléments HTML à chercher
`<h1>` à `<h6>`, `<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>`, `<section>`, `<article>`, `[role="banner"]`, `[role="navigation"]`, `[role="main"]`, `[role="contentinfo"]`, `[role="complementary"]`, `[role="search"]`, `<ul>`, `<ol>`, `<dl>`, `<blockquote>`, `<q>`.

### Règles axe-core à croiser
`heading-order`, `page-has-heading-one`, `landmark-banner-is-top-level`, `landmark-contentinfo-is-top-level`, `landmark-main-is-top-level`, `landmark-no-duplicate-banner`, `landmark-no-duplicate-contentinfo`, `landmark-no-duplicate-main`, `landmark-one-main`, `landmark-unique`, `region`, `list`, `listitem`, `definition-list`

### Vérifications IA
- **9.1** : Hiérarchie des headings logique et cohérente — pas de saut de niveau (h1 → h3 sans h2), un seul `<h1>` par page, headings reflètent la structure du contenu
- **9.2** : Structure du document — `<header>`, `<nav>`, `<main>`, `<footer>` présents. Croiser avec `headings_landmarks` de la phase 2
- **9.3** : Listes structurées correctement — `<ul>`/`<ol>` pour les listes, `<dl>` pour les définitions. Pas de fausses listes (tirets/puces en texte brut)
- **9.4** : Citations balisées avec `<blockquote>` ou `<q>`

### Patterns ARIA applicables
Consulter `aria-patterns.json` → pattern `landmarks`.

---

## Thématique 10 — Présentation (critères 10.1 à 10.14)

### Éléments HTML à chercher
Attributs de présentation inline (`style`, `align`, `bgcolor`, `border`, `cellpadding`, `cellspacing`, `width`, `height` sur éléments non-`<img>`), `<b>`, `<i>`, `<u>`, `<font>`, `<center>`, `<marquee>`, `<blink>`.

### Règles axe-core à croiser
`meta-viewport`, `avoid-inline-spacing`

### Vérifications IA — utiliser les données dynamiques de la phase 2
- **10.1** : Présentation faite en CSS, pas en HTML (pas d'attributs de présentation inline)
- **10.2** : Contenu compréhensible sans CSS — l'IA doit vérifier que l'ordre du DOM est logique
- **10.3** : Contenu compréhensible sans images CSS — vérifier que `background-image` ne porte pas d'information essentielle
- **10.4** : Zoom 200% — croiser avec `zoom_200` de la phase 2. Pas de chevauchement, pas de troncature, pas de perte d'information
- **10.7** : Focus visible — croiser avec `navigation_clavier.tests_dynamiques.focus_visible` de la phase 2. Chaque élément focusable doit avoir un indicateur visuel de focus
- **10.8** : Contenu caché visuellement mais accessible — vérifier que `display:none` et `visibility:hidden` ne masquent pas du contenu destiné aux lecteurs d'écran (utiliser `.sr-only` ou `clip-path` à la place)
- **10.11** : Reflow 320px — croiser avec `reflow_320px` de la phase 2. Pas de scroll horizontal, pas de contenu tronqué
- **10.12** : Espacement du texte personnalisable — vérifier que le contenu reste lisible avec `letter-spacing: 0.12em`, `word-spacing: 0.16em`, `line-height: 1.5`, `margin-bottom` sur paragraphes ≥ 2em
- **10.14** : Contenu additionnel au survol/focus — vérifier que les tooltips/popups sont fermables (Échap), restent visibles tant que le pointeur est dessus, et ne disparaissent pas sans action utilisateur

### Patterns ARIA applicables
Consulter `aria-patterns.json` → pattern `tooltip` pour 10.14.

---

## Thématique 11 — Formulaires (critères 11.1 à 11.13)

### Éléments HTML à chercher
`<form>`, `<input>`, `<select>`, `<textarea>`, `<button>`, `<label>`, `<fieldset>`, `<legend>`, `<output>`, `<datalist>`, `[autocomplete]`, `[required]`, `[aria-required]`, `[aria-invalid]`, `[aria-describedby]`, `[aria-errormessage]`.

### Règles axe-core à croiser
`label`, `select-name`, `input-button-name`, `input-image-alt`, `autocomplete-valid`, `form-field-multiple-labels`

### Vérifications IA
- **11.1/11.2** : Chaque champ a un `<label>` associé (via `for`/`id` ou imbrication) OU `aria-label`/`aria-labelledby`. Le label est pertinent
- **11.3** : Labels cohérents — le label visible correspond au nom accessible
- **11.5** : Regroupements logiques — champs liés dans un `<fieldset>` avec `<legend>` (ex: civilité, adresse)
- **11.6** : Regroupements dans les `<select>` — `<optgroup>` si les options sont catégorisées
- **11.8** : `autocomplete` présent et correct sur les champs d'identité (nom, email, téléphone, adresse)
- **11.9** : Boutons de soumission avec intitulé explicite
- **11.10** : Contrôle de saisie — messages d'erreur associés aux champs (`aria-describedby`, `aria-errormessage`, ou texte adjacent)
- **11.11** : Suggestions de correction en cas d'erreur
- **11.13** : Confirmation avant soumission définitive (données financières, juridiques)

### Patterns ARIA applicables
Consulter `aria-patterns.json` → patterns `combobox`, `listbox`, `spinbutton`, `checkbox`, `radio`, `switch`, `slider`.

---

## Thématique 12 — Navigation (critères 12.1 à 12.11)

### Éléments HTML à chercher
Skip links (`<a href="#content">`, `<a href="#main">`), `<nav>`, systèmes de navigation (menu, plan du site, moteur de recherche), `[tabindex]`, `[accesskey]`.

### Règles axe-core à croiser
`bypass`, `tabindex`, `accesskeys`

### Vérifications IA
- **12.1/12.2** : Systèmes de navigation cohérents — au moins 2 parmi : menu, plan du site, moteur de recherche. Présents sur toutes les pages (nécessite multi-pages, NT en mono-page)
- **12.6** : Skip link présent, visible au focus, fonctionnel (pointe vers `<main>` ou `#content`)
- **12.7** : Ordre de tabulation logique — croiser avec `navigation_clavier` de la phase 2. L'ordre Tab suit l'ordre visuel de lecture
- **12.8** : Pas de piège clavier — croiser avec `navigation_clavier.pieges_confirmes` de la phase 2. Chaque élément focusable peut être quitté avec Tab ou Shift+Tab
- **12.9** : Pas de raccourci clavier à une seule touche (sauf si désactivable ou remappable)
- **12.11** : Contenus additionnels au clavier — les menus déroulants, tooltips, etc. sont atteignables et fermables au clavier

### Patterns ARIA applicables
Consulter `aria-patterns.json` → patterns `landmarks`, `menubar`, `disclosure`, `dialog-modal`.

### Mode site (multi-pages)
En mode site, vérifier la cohérence inter-pages des systèmes de navigation. En mode mono-page, marquer 12.1 et 12.2 comme NT.

---

## Thématique 13 — Consultation (critères 13.1 à 13.12)

### Éléments HTML à chercher
`<a target="_blank">`, `<meta http-equiv="refresh">`, `[download]`, liens vers PDF/DOC/XLS, `<video autoplay>`, `<audio autoplay>`, animations CSS (`@keyframes`, `animation`), `prefers-reduced-motion`, `<marquee>`, `<blink>`.

### Règles axe-core à croiser
`meta-refresh`, `no-autoplay-audio`

### Vérifications IA
- **13.1** : Limites de temps — `<meta http-equiv="refresh">` interdit sauf si l'utilisateur peut prolonger ou désactiver
- **13.2** : Nouvelles fenêtres — `target="_blank"` doit être signalé à l'utilisateur (texte, icône, `aria-label`)
- **13.3/13.4** : Documents en téléchargement (PDF, DOC, XLS) — croiser avec `documents_pdf` de la phase 2. Vérifier accessibilité ou alternative accessible
- **13.7** : Pas d'effet de flash (> 3 par seconde) — NT (nécessite analyse temporelle)
- **13.8** : Animations — contrôlables (pause, stop) ou `prefers-reduced-motion` respecté
- **13.9** : Contenu en mouvement — `<marquee>`, carrousels auto-défilants doivent avoir un contrôle pause
- **13.11** : Orientation — croiser avec `orientation` de la phase 2. Pas de verrouillage d'orientation
- **13.12** : Gestuelles complexes — alternatives simples disponibles (swipe → boutons, pinch → boutons +/-)

### Patterns ARIA applicables
Consulter `aria-patterns.json` → pattern `carousel` pour les contenus en mouvement.

---

## Rappel : fichiers de référence à consulter

| Fichier | Quand le consulter |
|---|---|
| `rgaa-criteres.json` | Pour chaque critère : intitulé officiel, tests associés |
| `mapping-rgaa-wcag-eaa.json` | Pour chaque NC : correspondance WCAG + référence EAA |
| `aria-patterns.json` | Thématiques 7, 10, 11, 12 : validation des composants interactifs |
| `criteres-revue-manuelle.md` | Avant de remonter une NC : vérifier les cas de non-remontée |
| `wcag-sc.json` | Pour enrichir les descriptions WCAG dans le rapport |
| `eaa-references.json` | Pour les références EAA dans le rapport |
