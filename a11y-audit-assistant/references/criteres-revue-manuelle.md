# Critères RGAA — Guide de revue manuelle et cas de non-remontée

## Cas de non-remontée

Situations connues où un outil automatisé ou l'analyse IA détecte un problème apparent qui ne constitue PAS une non-conformité RGAA.

### 1. Landmarks uniques sans label
Si la page n'a qu'un seul landmark de chaque type, l'absence de `aria-label` n'est PAS une NC. Le RGAA n'exige des labels distinctifs que quand il y a plusieurs landmarks du même type.

### 2. aria-controls dynamique fonctionnel
Si `aria-controls` référence un ID créé dynamiquement (menu, dialog) et que le pattern ARIA est fonctionnel → observation, pas NC.

### 3. role="none"/"presentation" intentionnel
Si le contenu reste accessible par d'autres moyens (landmarks, headings) → pas une NC. Cas typique : `<table role="presentation">`.

### 4. axe-core "incomplete" sans confirmation
Les résultats `incomplete` d'axe-core sont des points de vérification, pas des violations. Ne remonter comme NC que si confirmé par une 2e source.

### 5. Alt générique en contexte redondant
Si le contexte adjacent fournit déjà l'information → observation, pas NC.

### 6. Contraste sur éléments désactivés
Le WCAG 1.4.3 exclut les composants inactifs (`disabled`, `aria-disabled`). Pas de NC.

## Vérifications par thématique

Pour chaque thématique, ce que l'IA doit vérifier au-delà d'axe-core :

| Thématique | Vérifications IA clés |
|---|---|
| 1. Images | Pertinence des alt (pas juste présence), images décoratives avec alt="" |
| 2. Cadres | Pertinence du titre iframe |
| 3. Couleurs | Information donnée uniquement par la couleur (champs erreur, liens) |
| 4. Multimédia | Sous-titres, transcription, audiodescription, contrôles clavier. Si aucun média → NA |
| 5. Tableaux | Structure headers/scope/caption cohérente avec le contenu |
| 6. Liens | Intitulés explicites hors contexte |
| 7. Scripts | Composants ARIA fonctionnels, changements de contexte signalés |
| 8. Éléments obligatoires | Cohérence langue déclarée vs contenu réel, changements de langue |
| 9. Structuration | Hiérarchie headings logique, landmarks pertinents |
| 10. Présentation | Focus visible, contenu lisible sans CSS, zoom 200%, reflow 320px |
| 11. Formulaires | Labels clairs, autocomplete pertinent, regroupements logiques |
| 12. Navigation | Skip link, ordre tabulation logique, pas de piège clavier |
| 13. Consultation | PDF accessibles, animations contrôlables, orientation libre |

## Critères nécessitant toujours une revue manuelle (NT)

Ces critères ne peuvent pas être évalués de manière fiable par l'IA seule :
- 1.3 : pertinence des alternatives textuelles (jugement subjectif)
- 4.2/4.4/4.6 : pertinence des sous-titres/audiodescription (contenu multimédia)
- 12.1/12.2 : systèmes de navigation cohérents (nécessite multi-pages)
- 13.7 : effets de flash (nécessite analyse temporelle)
