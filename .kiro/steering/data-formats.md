---
description: Schémas JSON des formats de données inter-phases du skill a11y-audit-assistant. Référence pour la validation des données entre les 5 phases de l'agent unique a11y-auditor.
globs:
  - a11y-audit-assistant/**
  - .kiro/specs/a11y-audit-assistant/**
---

# Formats de données inter-phases — a11y-audit-assistant

Ce document définit les schémas JSON de tous les formats de données utilisés par l'agent unique `a11y-auditor`. Ces schémas sont la référence pour la validation des données entre les 5 phases séquentielles de l'agent.

## 1. Format de sortie scan (par page)

Produit par la **phase 2 (scan technique)** pour chaque page auditée. Contient **10 sections de base** obligatoires et **3 sections dynamiques conditionnelles** (mode URL uniquement, via Playwright MCP).

### Sections de base (toujours présentes)

| Section | Description |
|---|---|
| `violations_axe` | Violations axe-core (injecté via `browser_evaluate`) |
| `arbre_accessibilite` | Arbre d'accessibilité (Playwright MCP `browser_snapshot`, mode URL) ou indisponible |
| `navigation_clavier` | Analyse clavier statique + tests dynamiques Playwright MCP (mode URL) |
| `aria_validation` | Validation ARIA (règles axe-core + arbre a11y `browser_snapshot`) |
| `contrastes` | Contrastes par élément et par état CSS (axe-core + `browser_evaluate`/`browser_hover`) |
| `documents_pdf` | Documents PDF liés (structure, titre, langue) |
| `medias` | Éléments vidéo/audio (sous-titres, transcription, contrôles) |
| `orientation` | Verrouillage d'orientation (axe-core rule `css-orientation-lock`) |
| `headings_landmarks` | Hiérarchie headings h1-h6, landmarks ARIA, outline |
| `ressources_non_resolues` | Ressources externes non résolues (mode sans URL) |

### Sections dynamiques conditionnelles (mode URL, Playwright MCP)

| Section | Description |
|---|---|
| `reflow_320px` | Test reflow viewport 320px (WCAG 1.4.10 / RGAA 10.11) |
| `zoom_200` | Test zoom 200% (WCAG 1.4.4 / RGAA 10.4) |
| `controles_video_clavier` | Test accessibilité clavier des contrôles vidéo (RGAA 4.13) |

### Schéma JSON complet

```json
{
  "page": {
    "id": "string — identifiant unique (ex: p01)",
    "nom": "string — nom descriptif (ex: accueil)",
    "url": "string | null — URL de la page (null en mode HTML)",
    "mode": "string — url | html | project"
  },
  "timestamp": "string — ISO 8601 (ex: 2025-01-15T10:30:00Z)",

  "violations_axe": [
    {
      "rule_id": "string — identifiant de la règle axe-core (ex: color-contrast)",
      "description": "string — description de la règle",
      "impact": "string — critical | serious | moderate | minor",
      "wcag_criteria": ["string — critères WCAG (ex: 1.4.3)"],
      "nodes": [
        {
          "html": "string — extrait HTML de l'élément",
          "css": "string — extrait CSS pertinent",
          "target": ["string — sélecteur CSS de l'élément"],
          "failure_summary": "string — résumé de l'échec"
        }
      ]
    }
  ],

  "arbre_accessibilite": {
    "disponible": "boolean — true si l'arbre a été extrait",
    "source": "string — playwright_mcp_browser_snapshot",
    "snapshot": [
      {
        "role": "string — rôle ARIA (ex: navigation, link, button)",
        "name": "string — nom accessible",
        "children": ["récursif — même structure"]
      }
    ],
    "problemes": [
      {
        "element": "string — extrait HTML",
        "role": "string — rôle ARIA détecté",
        "nom_accessible": "string — nom accessible (vide si absent)",
        "probleme": "string — description du problème"
      }
    ],
    "note": "string — note contextuelle (ex: non disponible en mode HTML)"
  },

  "navigation_clavier": {
    "ordre_tabulation_estime": ["string — sélecteurs dans l'ordre estimé"],
    "pieges_potentiels": ["string — description des pièges détectés"],
    "elements_sans_focus_css": ["string — éléments sans style :focus"],
    "elements_interactifs_total": "number",
    "elements_avec_tabindex": "number",
    "tests_dynamiques": {
      "disponible": "boolean — true si Playwright MCP a exécuté les tests",
      "ordre_tabulation_reel": ["string — sélecteurs dans l'ordre réel Tab"],
      "pieges_confirmes": ["string — pièges confirmés par simulation"],
      "focus_visible": [
        {
          "element": "string — sélecteur de l'élément",
          "focus_visible": "boolean",
          "outline_style": "string — style CSS du focus"
        }
      ],
      "note": "string"
    }
  },

  "aria_validation": {
    "erreurs": [
      {
        "element": "string — extrait HTML",
        "message": "string — description de l'erreur ARIA"
      }
    ]
  },

  "contrastes": [
    {
      "element": "string — sélecteur CSS",
      "html": "string — extrait HTML",
      "etats": {
        "defaut": {
          "foreground": "string — couleur hex",
          "background": "string — couleur hex",
          "ratio": "number — ratio de contraste",
          "conforme": "boolean",
          "source": "string — css_statique | playwright_mcp_dynamique"
        },
        "hover": {
          "foreground": "string",
          "background": "string",
          "ratio": "number",
          "conforme": "boolean",
          "source": "string — css_statique | playwright_mcp_dynamique"
        },
        "focus": {
          "foreground": "string",
          "background": "string",
          "ratio": "number",
          "conforme": "boolean",
          "source": "string — css_statique | playwright_mcp_dynamique"
        }
      },
      "ratio_attendu": "number — 4.5 pour texte normal, 3.0 pour grand texte",
      "note": "string"
    }
  ],

  "documents_pdf": [
    {
      "url": "string — URL du PDF",
      "nom_fichier": "string",
      "taille_octets": "number",
      "est_tagge": "boolean — présence /MarkInfo et /StructTreeRoot",
      "titre": "string | null — /Title",
      "langue": "string | null — /Lang",
      "statut": "string — verifie | non_verifie",
      "note": "string — recommandation PAC si applicable",
      "criteres_rgaa": ["string — 13.3, 13.4"]
    }
  ],

  "medias": [
    {
      "element": "string — sélecteur (ex: video#intro)",
      "html": "string — extrait HTML",
      "type": "string — video | audio",
      "sous_titres": "boolean",
      "transcription": "boolean",
      "audiodescription": "boolean",
      "controles_clavier": "boolean",
      "statut": "string — verifie | non_verifie",
      "criteres_rgaa": ["string — ex: 4.1, 4.3, 4.5, 4.13"]
    }
  ],

  "orientation": {
    "verrouillage_detecte": "boolean",
    "orientation_forcee": "string | null — portrait | paysage",
    "critere_wcag": "string — 1.3.4",
    "criteres_rgaa": ["string — ex: 10.11"]
  },

  "reflow_320px": {
    "disponible": "boolean",
    "screenshot_path": "string | null — chemin relatif du screenshot 320px",
    "viewport_width": "number — 320",
    "debordements_horizontaux": [
      {
        "element": "string — sélecteur",
        "largeur_reelle": "number — largeur en px",
        "description": "string"
      }
    ],
    "contenus_tronques": ["string"],
    "note": "string"
  },

  "zoom_200": {
    "disponible": "boolean",
    "methode": "string — css_zoom | css_transform",
    "chevauchements": ["string — descriptions des chevauchements"],
    "contenus_tronques": ["string"],
    "perte_information": "boolean",
    "note": "string"
  },

  "controles_video_clavier": {
    "disponible": "boolean",
    "resultats": [
      {
        "element": "string — sélecteur vidéo",
        "controles_atteignables": "boolean",
        "controles_activables": "boolean",
        "detail": "string — description du test"
      }
    ],
    "note": "string"
  },

  "headings_landmarks": {
    "headings": [
      {
        "niveau": "number — 1 à 6",
        "texte": "string — contenu textuel du heading",
        "element": "string — balise HTML (h1, h2, etc.)"
      }
    ],
    "landmarks": [
      {
        "role": "string — banner | navigation | main | contentinfo | etc.",
        "label": "string | null — aria-label ou aria-labelledby",
        "element": "string — balise HTML (header, nav, main, footer, etc.)"
      }
    ],
    "outline": "string — outline textuel hiérarchique du document"
  },

  "ressources_non_resolues": [
    {
      "type": "string — css | js | img | font | etc.",
      "url": "string — URL de la ressource",
      "impact": "string — description de l'impact potentiel"
    }
  ],

  "erreurs": ["string — erreurs survenues pendant le scan"]
}
```

## 2. Format intermédiaire normalisé (source unique de vérité)

Produit par la **phase 3 (analyse IA thématique RGAA)**, vérifié en **phase 4 (fusion et cohérence)**, consommé par la **phase 5 (rapport MD + grille Excel)**. Ce format est la **source unique de vérité** garantissant la cohérence entre le rapport Markdown et la grille Excel.

### Schéma JSON complet

```json
{
  "audit": {
    "date": "string — YYYY-MM-DD",
    "mode": "string — url | html | site | project",
    "versions": {
      "rgaa": "string — ex: 4.1.2",
      "wcag": "string — ex: 2.2",
      "eaa": "string — ex: 2019/882"
    },
    "outils": {
      "axe_core": "string — version axe-core",
      "playwright_mcp": "string — version Playwright MCP"
    }
  },

  "pages": [
    {
      "id": "string — identifiant unique (ex: p01)",
      "nom": "string — nom descriptif",
      "url": "string | null",
      "mode": "string — url | html | project",
      "statut": "string — ok | erreur",
      "erreur": "string | null — description de l'erreur"
    }
  ],

  "pages_en_erreur": [
    {
      "id": "string",
      "url": "string",
      "erreur": "string — type d'erreur (timeout, mcp_error, etc.)",
      "detail": "string — description détaillée"
    }
  ],

  "non_conformites": [
    {
      "id": "string — identifiant unique (NC-XXX)",
      "page_id": "string — DOIT référencer un id existant dans pages[]",
      "critere_rgaa": "string — numéro du critère (ex: 3.2)",
      "critere_wcag": "string — numéro WCAG (ex: 1.4.3)",
      "reference_eaa": "string | null — référence EAA si applicable",
      "severite": "string — bloquante | majeure | mineure",
      "source": "string — axe-core | arbre-a11y | clavier | contrastes | analyse-ia | pdf | medias",
      "niveau_confiance": "string | null — eleve | moyen | faible (null si source non-IA)",
      "justification": "string | null — raisonnement IA (null si source non-IA)",
      "erreur_critique": "boolean — true si erreur critique/évidente",
      "description": "string — description du problème",
      "element_html": "string — extrait HTML de l'élément en cause",
      "element_css": "string — extrait CSS pertinent",
      "correction": {
        "code_avant": "string — code problématique",
        "code_apres": "string — code corrigé suggéré",
        "explication": "string — explication de la correction",
        "critere_rgaa": "string — critère RGAA concerné",
        "priorite": "string — haute | moyenne | basse"
      },
      "details": "object — détails spécifiques (ratios, états, etc.)",
      "mapping_rgaa_absent": "boolean — true si pas de correspondance RGAA"
    }
  ],

  "easy_wins": [
    {
      "correction": "string — description de la correction",
      "criteres_impactes": ["string — critères RGAA impactés"],
      "nombre_criteres": "number",
      "priorite": "string — haute | moyenne | basse"
    }
  ],

  "criteres_rgaa_statuts": [
    {
      "critere": "string — numéro du critère (ex: 1.1)",
      "thematique": "string — nom de la thématique RGAA",
      "statut": "string — conforme | non_conforme | non_applicable | revue_manuelle_necessaire",
      "observations": "string — observations associées",
      "non_conformites_ids": ["string — IDs des NC liées (ex: NC-005)"]
    }
  ],

  "statistiques": {
    "total_nc": "number",
    "taux_conformite": "number — pourcentage (critères conformes / applicables × 100)",
    "criteres_applicables": "number",
    "criteres_conformes": "number",
    "par_severite": {
      "bloquante": "number",
      "majeure": "number",
      "mineure": "number"
    },
    "par_thematique": {
      "Images": "number",
      "Cadres": "number",
      "Couleurs": "number",
      "Multimédia": "number",
      "Tableaux": "number",
      "Liens": "number",
      "Scripts": "number",
      "Éléments obligatoires": "number",
      "Structuration": "number",
      "Présentation": "number",
      "Formulaires": "number",
      "Navigation": "number",
      "Consultation": "number"
    },
    "par_source": {
      "axe-core": "number",
      "arbre-a11y": "number",
      "clavier": "number",
      "contrastes": "number",
      "analyse-ia": "number",
      "pdf": "number",
      "medias": "number"
    }
  },

  "criteres_revue_manuelle": [
    {
      "critere_rgaa": "string — numéro du critère",
      "description": "string — description du critère",
      "type_verification": "string — type de vérification manuelle requise"
    }
  ],

  "ressources_non_resolues": [
    {
      "page_id": "string",
      "type": "string — css | js | img | font",
      "url": "string",
      "impact": "string — description de l'impact"
    }
  ]
}
```

### Contraintes de validation

- `criteres_rgaa_statuts` DOIT contenir **exactement 106 entrées** (une par critère RGAA)
- Chaque `page_id` dans `non_conformites` DOIT exister dans `pages[]`
- Pas de NC en doublon (même `critere_rgaa` + même `element_html` + même `page_id`)
- Pas de NC orphelines (référençant un `page_id` absent)
- `statistiques.total_nc` DOIT être égal à `non_conformites.length`
- `statistiques.taux_conformite` DOIT être cohérent avec `criteres_conformes / criteres_applicables × 100`
- `statistiques.par_severite` DOIT correspondre au décompte réel des NC par sévérité

## 3. Métadonnées d'audit

Transmises par la **phase 4 (fusion et cohérence)** à la phase 5 (rapport + grille) avec le format intermédiaire global.

```json
{
  "date_audit": "string — YYYY-MM-DD",
  "mode": "string — url | html | site | project",
  "versions": {
    "rgaa": "string — ex: 4.1.2",
    "wcag": "string — ex: 2.2",
    "eaa": "string — ex: 2019/882"
  },
  "pages_en_erreur": [
    {
      "id": "string",
      "url": "string",
      "erreur": "string"
    }
  ],
  "outils": {
    "axe_core": "string — version",
    "playwright_mcp": "string — version"
  }
}
```

## 4. Format uniforme des corrections (avec priorité)

Chaque NC contient un objet `correction` au format uniforme :

```json
{
  "correction": {
    "code_avant": "string — code HTML/CSS problématique",
    "code_apres": "string — code HTML/CSS corrigé",
    "explication": "string — explication courte de la correction",
    "critere_rgaa": "string — critère RGAA concerné (ex: 1.1)",
    "priorite": "string — haute | moyenne | basse"
  }
}
```

### Règles de priorité

La priorité est déterminée selon les **3 axes du modèle officiel RGAA** :

| Priorité | Critères |
|---|---|
| **haute** | Fonctionnalités essentielles / contenu principal OU critères prioritaires bloquant l'accès |
| **moyenne** | Critères importants mais non bloquants, facilité de mise en œuvre moyenne |
| **basse** | Améliorations mineures, faible impact utilisateur |

### Contraintes

- Tous les champs (`code_avant`, `code_apres`, `explication`, `critere_rgaa`, `priorite`) sont **obligatoires et non vides**
- `priorite` DOIT être l'une des 3 valeurs : `haute`, `moyenne`, `basse`
- `code_avant` et `code_apres` DOIVENT être différents (sinon la correction est inutile)

## 5. Format grille-instructions.json

Produit par la **phase 5 (rapport + grille Excel)**, consommé par le script Node.js `a11y-audit-assistant/scripts/generate-xlsx.mjs` pour produire le fichier `.xlsx` final. Structure : **par page, 7 colonnes** conformes au modèle ODS officiel.

### Schéma JSON complet

```json
{
  "pages": [
    {
      "id": "string — identifiant de la page (ex: p01)",
      "nom": "string — nom descriptif (ex: accueil)",
      "url": "string | null — URL de la page",
      "criteres": [
        {
          "critere": "string — numéro du critère RGAA (ex: 1.1)",
          "thematique": "string — nom de la thématique (ex: Images)",
          "recommandation": "string — intitulé complet du critère RGAA",
          "statut": "string — C | NC | NA | NT",
          "derogation": "string — N | O",
          "modifications": "string — texte libre (observations, recommandations de correction)",
          "commentaires": "string — commentaires en cas de dérogation",
          "non_conformites_ids": ["string — IDs des NC liées (ex: NC-005, NC-006)"]
        }
      ]
    }
  ],
  "metadata": {
    "date_audit": "string — YYYY-MM-DD",
    "versions": {
      "rgaa": "string — ex: 4.1.2",
      "wcag": "string — ex: 2.2"
    },
    "en_tete": "string — ex: RGAA 4.1.2 – GRILLE D'ÉVALUATION"
  }
}
```

### Correspondance colonnes Excel

| Colonne | Champ JSON | Description |
|---|---|---|
| A | `thematique` | Thématique RGAA (Images, Cadres, Couleurs, etc.) |
| B | `critere` | Numéro du critère (1.1, 1.2, ..., 13.12) |
| C | `recommandation` | Intitulé complet du critère RGAA |
| D | `statut` | C (Conforme), NC (Non Conforme), NA (Non Applicable), NT (Non Testé) |
| E | `derogation` | N (Non) ou O (Oui) |
| F | `modifications` | Recommandations de correction pour les critères NC |
| G | `commentaires` | Commentaires en cas de dérogation |

### Contraintes

- Chaque page DOIT contenir **exactement 106 entrées** dans `criteres[]` (une par critère RGAA)
- Les 13 thématiques RGAA DOIVENT être représentées : Images, Cadres, Couleurs, Multimédia, Tableaux, Liens, Scripts, Éléments obligatoires, Structuration, Présentation, Formulaires, Navigation, Consultation
- `statut` DOIT être l'une des 4 valeurs : `C`, `NC`, `NA`, `NT`
- `derogation` DOIT être `N` ou `O`
- Si `statut` = `NC`, alors `modifications` DOIT être non vide
- Les statuts DOIVENT être cohérents avec le format intermédiaire normalisé (`conforme` → `C`, `non_conforme` → `NC`, `non_applicable` → `NA`, `revue_manuelle_necessaire` → `NT`)
- Le `grille-instructions.json` DOIT être validé avant appel au script generate-xlsx.mjs

## 6. Format d'entrée de l'agent

```json
{
  "mode": "string — url | html | site | project",
  "site_url": "string | null — URL du site (mode site)",
  "pages": [
    {
      "id": "string",
      "nom": "string",
      "url": "string"
    }
  ],
  "html_code": "string | null — code HTML (mode html)",
  "css_code": "string | null — code CSS (mode html)",
  "project_path": "string | null — chemin du projet (mode project)",
  "options": {
    "wcag_levels": ["string — A, AA"],
    "seuil_confiance": "string — eleve | moyen | faible (défaut: moyen)",
    "perimetre": "string — toutes | selection | mono-page",
    "timeout": "number — secondes (défaut: 30)"
  }
}
```

## 7. Format d'erreur structuré

```json
{
  "erreur": true,
  "phase": "string — phase en cours (ex: scan, analyse_ia, fusion, rapport_grille)",
  "etape": "string — étape en cours (ex: axe-core, thematique_images, fusion, pdf)",
  "page_id": "string — identifiant de la page (ex: p01)",
  "message": "string — message d'erreur lisible",
  "detail": "string — détail technique (URL, stack, etc.)"
}
```

## 8. Règles de validation des données entre phases

### Phase scan → Phase analyse IA thématique

- Le JSON de sortie scan DOIT être parsable
- Les 10 sections de base DOIVENT être présentes (même vides)
- Chaque violation dans `violations_axe` DOIT avoir `rule_id`, `description`, `impact`, `wcag_criteria`, `nodes`
- `page.id` et `page.mode` DOIVENT être non vides

### Phase analyse IA thématique → Phase fusion et cohérence

- Le format intermédiaire normalisé DOIT être parsable
- `criteres_rgaa_statuts` DOIT contenir exactement 106 entrées
- Chaque NC DOIT avoir tous les champs obligatoires non vides
- `statistiques` DOIT être cohérent avec les données détaillées

### Phase fusion et cohérence → Phase rapport + grille

- Le format fusionné DOIT conserver toutes les NC existantes
- Les NC ajoutées par l'analyse IA DOIVENT avoir `source: "analyse-ia"`, `niveau_confiance` non null, `justification` non null
- `criteres_rgaa_statuts` DOIT toujours contenir exactement 106 entrées

### Phase fusion → Phase rapport MD et grille Excel

- Le format intermédiaire global DOIT être le résultat fusionné de toutes les données par page
- Pas de NC en doublon (même critère + même élément + même page)
- Pas de NC orphelines
- `statistiques` recalculées et vérifiées
- Les deux phases de génération de rapports utilisent les mêmes données en mémoire

### Phase grille Excel → Script Node.js

- `grille-instructions.json` DOIT être validé par un schéma zod
- Chaque page DOIT avoir 106 critères
- Les statuts DOIVENT être `C`, `NC`, `NA` ou `NT`

_Exigences couvertes : 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5_
