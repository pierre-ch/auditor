# Template — Rapport d'audit d'accessibilité RGAA 4.1.2

Ce template définit la structure exacte du rapport Markdown produit en phase 5. Les sections entre `{accolades}` sont remplacées par les données de l'audit. Ce template est conforme au modèle officiel de rapport d'audit RGAA (DINUM, licence ouverte 2.0).

Structure alignée sur l'exigence 4 du requirements.md.

---

## Structure du rapport

```markdown
# Rapport d'audit d'accessibilité — {nom_site}

## 1. Introduction

### 1.1 Contexte

| Champ | Valeur |
|---|---|
| URL du site | {url_site} |
| Date de l'audit | {date_audit} |
| Référentiel | RGAA {version_rgaa} |
| Norme européenne | EN 301 549 V3.2.1 |
| Niveau de conformité visé | AA |
| Technologies du site | {technologies_detectees} |
| Outils d'audit | axe-core {version_axe} via Playwright MCP |
| Environnement de test | {navigateur}, {OS} |

**Périmètre** : {description_perimetre}

**Méthode** : L'audit combine un scan automatisé (axe-core, ~57% des critères WCAG couverts) et une analyse IA thématique des 13 thématiques RGAA critère par critère. Les résultats automatisés ne constituent pas un audit complet — les critères nécessitant un jugement humain sont identifiés.

{SI pages_en_erreur : "Les pages suivantes n'ont pas pu être analysées : {liste_pages_erreur}"}

### 1.2 Échantillon de pages

| # | Page | URL | NC bloquantes | NC majeures | NC mineures |
|---|---|---|---|---|---|
| P01 | {nom_page} | {url_page} | {count_bloquante} | {count_majeure} | {count_mineure} |
| ... | ... | ... | ... | ... | ... |

### 1.3 Accessibilité du site

**Taux de conformité global : {taux}%**

Formule RGAA : C / (C + NC) × 100, en excluant les critères NA et NT.

| Indicateur | Valeur |
|---|---|
| Critères conformes (C) | {count_c} |
| Critères non conformes (NC) | {count_nc} |
| Critères non applicables (NA) | {count_na} |
| Critères non testés (NT) | {count_nt} |

**Vue d'ensemble** : {synthese_qualitative}

**Points forts** :
- {point_fort_1}
- {point_fort_2}

**Points faibles** :
- {point_faible_1}
- {point_faible_2}

### 1.4 Conformité par thématique

| # | Thématique | C | NC | NA | NT | Taux |
|---|---|---|---|---|---|---|
| 1 | Images | ... | ... | ... | ... | ...% |
| 2 | Cadres | ... | ... | ... | ... | ...% |
| 3 | Couleurs | ... | ... | ... | ... | ...% |
| 4 | Multimédia | ... | ... | ... | ... | ...% |
| 5 | Tableaux | ... | ... | ... | ... | ...% |
| 6 | Liens | ... | ... | ... | ... | ...% |
| 7 | Scripts | ... | ... | ... | ... | ...% |
| 8 | Éléments obligatoires | ... | ... | ... | ... | ...% |
| 9 | Structuration | ... | ... | ... | ... | ...% |
| 10 | Présentation | ... | ... | ... | ... | ...% |
| 11 | Formulaires | ... | ... | ... | ... | ...% |
| 12 | Navigation | ... | ... | ... | ... | ...% |
| 13 | Consultation | ... | ... | ... | ... | ...% |

---

## 2. Description des erreurs d'accessibilité

### 2.0 Erreurs critiques

{Sous-section dédiée en début, avant les thématiques. Liste les erreurs évidentes et graves détectées automatiquement : page sans <html lang>, sans <title>, images sans alt, champs sans label, absence de skip link, piège clavier, absence de DOCTYPE.}

| Erreur critique | Page(s) | Critère RGAA | Sévérité |
|---|---|---|---|
| {description_erreur_critique} | {pages_concernees} | {critere_rgaa} | Bloquante |
| ... | ... | ... | ... |

### 2.1 Thématique 1 — Images

{Texte introductif : résumé des constats pour cette thématique.}

#### Critère 1.1 — {statut}

**Intitulé** : {intitulé_officiel_rgaa}

**Correspondances** :
- WCAG : {numero_wcag} — {titre_wcag} (Niveau {niveau})
- EAA : {reference_eaa}

**Constat** : {description_constat}

**Éléments concernés** :
- `{selecteur_css}` — {description_element}

**Correction recommandée** :

Avant :
```html
{code_avant}
```

Après :
```html
{code_apres}
```

**Explication** : {explication_correction}
**Sévérité** : {severite}
**Priorité** : {priorite} ({axe_priorisation})
{SI source == "analyse-ia" : "**Source** : analyse IA (confiance : {niveau_confiance})"}

---

{Répéter pour chaque critère NC de la thématique}

### 2.2 Thématique 2 — Cadres
{Même structure}

### 2.3 Thématique 3 — Couleurs
{Même structure}

{... thématiques 4 à 13 ...}

---

## 3. Conclusion

### 3.1 Avis

{Avis général de l'auditeur : niveau d'accessibilité constaté, évolution par rapport à un éventuel audit précédent, principaux axes d'amélioration.}

**Points forts du site** :
- {point_fort_detaille_1}
- {point_fort_detaille_2}

### 3.2 Priorisation des corrections

Les corrections sont organisées selon les 3 axes du modèle officiel RGAA :

**Axe 1 — Fonctionnalités essentielles / contenu principal** :
1. {correction_prioritaire} — Critères : {criteres}, Sévérité : {severite}
2. ...

**Axe 2 — Critères prioritaires bloquant l'accès** :
1. {correction_prioritaire} — Critères : {criteres}, Sévérité : {severite}
2. ...

**Axe 3 — Facilité de mise en œuvre (easy wins)** :
1. {correction_prioritaire} — Critères impactés : {liste_criteres}
2. ...

---

## 4. Annexes

### A. Critères couverts automatiquement

{Liste des critères RGAA évalués par axe-core et les tests dynamiques Playwright.}

### B. Critères évalués par l'analyse IA

{Liste des critères RGAA enrichis par le raisonnement sémantique IA, avec leur niveau de confiance.}

### C. Critères nécessitant une revue manuelle

Les critères suivants n'ont pas pu être évalués de manière fiable par l'audit automatisé et nécessitent une vérification humaine :

| Critère RGAA | Intitulé | Raison |
|---|---|---|
| {critere} | {intitule} | {type_verification_manuelle} |
| ... | ... | ... |

### D. Grille d'audit Excel

La grille d'audit RGAA au format Excel (.xlsx) est annexée à ce rapport. Elle contient les 106 critères RGAA par page auditée.

### E. Méthodologie

L'audit combine deux approches complémentaires :
1. **Scan automatisé** (axe-core {version_axe} via Playwright MCP) : détection des violations techniques. axe-core couvre environ 57% des critères WCAG de manière automatisée.
2. **Analyse IA thématique** : parcours des 13 thématiques RGAA critère par critère, en croisant HTML, CSS computé, arbre d'accessibilité et captures d'écran. Les NC issues de l'IA sont marquées avec un niveau de confiance.
3. **Fusion et cohérence** : les résultats des deux sources sont fusionnés. axe-core a priorité sur les critères automatisables. Voir `.kiro/steering/data-formats.md` §Résolution des conflits.

### F. Limitations

- Cet audit est basé sur un échantillon de pages et ne couvre pas l'exhaustivité du site.
- Les critères marqués NT nécessitent une vérification manuelle complémentaire.
- {limitations_specifiques : pages non testées, éléments derrière authentification, scan axe-core impossible, tests dynamiques échoués}

### G. Références

- RGAA {version_rgaa} : https://accessibilite.numerique.gouv.fr/
- WCAG 2.2 : https://www.w3.org/TR/WCAG22/
- EAA : https://eur-lex.europa.eu/eli/dir/2019/882/oj
- WAI-ARIA APG 1.2 : https://www.w3.org/WAI/ARIA/apg/
- Glossaire RGAA : voir `references/rgaa-glossaire.json`
```

## Règles de rédaction

1. **Langue** : le rapport est en français
2. **Ton** : professionnel mais accessible — un chef de projet non-technique doit comprendre les constats
3. **Code** : toujours montrer avant/après pour les NC
4. **Correspondances** : chaque NC mentionne le SC WCAG et la référence EAA (via `mapping-rgaa-wcag-eaa.json`)
5. **Pas de faux positifs** : ne remonter que les NC confirmées par au moins 2 sources
6. **Critères NA** : ne pas détailler, juste compter en synthèse
7. **Critères C** : mentionner en synthèse, pas de détail sauf observation utile
8. **Erreurs critiques** : toujours en section 2.0, avant les thématiques
9. **Source IA** : toujours indiquer quand une NC vient de l'analyse IA (source + confiance)
10. **Rapports par page** : même structure que le rapport global mais limitée au périmètre de la page
