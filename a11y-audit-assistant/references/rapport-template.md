# Template — Rapport d'audit d'accessibilité RGAA 4.1.2

L'IA utilise ce template pour générer le rapport Markdown final. Les sections entre `{accolades}` sont remplacées par les données de l'audit.

---

## Structure du rapport

```markdown
# Rapport d'audit d'accessibilité — {nom_site}

## Informations générales

| Champ | Valeur |
|---|---|
| URL du site | {url_site} |
| Date de l'audit | {date_audit} |
| Référentiel | RGAA 4.1.2 |
| Norme européenne | EN 301 549 V3.2.1 |
| Niveau de conformité visé | AA |
| Outil d'audit automatisé | axe-core {version_axe} via Playwright |
| Pages auditées | {nombre_pages} |

## Échantillon de pages

| # | Page | URL |
|---|---|---|
| P01 | {nom_page} | {url_page} |
| ... | ... | ... |

## Synthèse des résultats

### Taux de conformité global

| Indicateur | Valeur |
|---|---|
| Critères conformes (C) | {count_c} |
| Critères non conformes (NC) | {count_nc} |
| Critères non applicables (NA) | {count_na} |
| Critères non testés (NT) | {count_nt} |
| **Taux de conformité** | **{taux}%** |

Le taux de conformité est calculé selon la formule officielle RGAA :
**C / (C + NC) × 100**, en excluant les critères NA et NT.

### Répartition par sévérité

| Sévérité | Nombre |
|---|---|
| Bloquante | {count_bloquante} |
| Majeure | {count_majeure} |
| Mineure | {count_mineure} |

### Conformité par thématique

| # | Thématique | C | NC | NA | NT | Taux |
|---|---|---|---|---|---|---|
| 1 | Images | ... | ... | ... | ... | ...% |
| 2 | Cadres | ... | ... | ... | ... | ...% |
| ... | ... | ... | ... | ... | ... | ... |

## Résultats détaillés par thématique

### Thématique 1 — Images

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

**Sévérité** : {severite}
**Priorité de correction** : {priorite}

---

(Répéter pour chaque critère NC ou NT de chaque thématique)

## Conformité EAA — Directive 2019/882

{Si le site est concerné par l'EAA (e-commerce, banque, transport, etc.)}

| Exigence EAA (Annexe I, Section III) | Statut | Critères RGAA liés |
|---|---|---|
| {exigence_eaa} | {conforme/non_conforme} | {criteres_rgaa} |

## Limitations de l'audit

- {Liste des limitations : pages non testées, éléments derrière authentification, scan axe-core impossible, tests dynamiques échoués}
- Critères marqués NT nécessitent une vérification manuelle complémentaire.
- Cet audit est basé sur un échantillon de pages et ne couvre pas l'exhaustivité du site.

## Recommandations prioritaires

1. **{action_prioritaire_1}** — Impact : {severite}, critères : {criteres_concernes}
2. **{action_prioritaire_2}** — Impact : {severite}, critères : {criteres_concernes}
3. ...

Les corrections sont ordonnées par sévérité (bloquante → majeure → mineure) puis par nombre de critères impactés.

## Annexes

### A. Méthodologie

L'audit combine deux approches complémentaires :
1. **Scan automatisé** (axe-core via Playwright) : détection des violations techniques (contrastes, attributs ARIA, alt manquants, etc.)
2. **Analyse IA thématique** : parcours des 13 thématiques RGAA critère par critère, en croisant HTML, CSS computé, arbre d'accessibilité et captures d'écran.

Les résultats des deux sources sont fusionnés avec résolution des conflits (voir `steering/data-formats.md`).

### B. Glossaire

Voir le glossaire officiel RGAA : `references/rgaa-glossaire.json`

### C. Références

- RGAA 4.1.2 : https://accessibilite.numerique.gouv.fr/
- WCAG 2.2 : https://www.w3.org/TR/WCAG22/
- EAA : https://eur-lex.europa.eu/eli/dir/2019/882/oj
- WAI-ARIA APG 1.2 : https://www.w3.org/WAI/ARIA/apg/
```

## Règles de rédaction

1. **Langue** : le rapport est en français
2. **Ton** : professionnel mais accessible — un chef de projet non-technique doit comprendre les constats
3. **Code** : toujours montrer avant/après pour les NC
4. **Correspondances** : chaque critère NC mentionne le SC WCAG et la référence EAA le cas échéant
5. **Pas de faux positifs** : ne remonter que les NC confirmées par au moins 2 sources
6. **Critères NA** : ne pas détailler, juste lister en synthèse
7. **Critères C** : mentionner en synthèse, pas de détail sauf si observation utile
