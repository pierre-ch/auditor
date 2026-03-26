---
description: Règles qualité Quality-First pour le skill a11y-audit-assistant. Appliquées systématiquement à toute modification ou extension du skill.
globs:
  - a11y-audit-assistant/**
  - .kiro/specs/a11y-audit-assistant/**
---

# Quality-First — Règles qualité du skill a11y-audit-assistant

## Principe fondamental

Aucun compromis de qualité n'est acceptable. Si un compromis semble inévitable, **ARRÊTER** et demander une validation explicite à l'utilisateur avant de poursuivre.

## Règles de code

### Interdictions strictes

- **Aucun code mort** : tout code non utilisé doit être supprimé, pas commenté
- **Aucun code commenté** : les blocs de code commentés (`// ancien code`, `/* disabled */`) sont interdits
- **Aucun TODO hack** : les `TODO`, `FIXME`, `HACK`, `XXX` temporaires sont interdits. Si un problème est identifié, il doit être résolu immédiatement ou documenté dans une issue
- **Aucun contournement de test** : les `skip`, `xit`, `xdescribe`, `.only` en production sont interdits. Les tests doivent passer sans exception

### Gestion d'erreurs par phase

L'agent unique `a11y-auditor` DOIT, pour chaque phase :

1. **Valider ses entrées** : vérifier que les données en mémoire contiennent les champs requis avant tout traitement
2. **Valider ses sorties** : vérifier que les données produites sont conformes au schéma attendu avant de passer à la phase suivante
3. **Gérer chaque erreur explicitement** : aucun `catch` vide, aucune erreur silencieuse. Chaque erreur doit être consignée avec contexte (phase, étape, données concernées)
4. **Produire des erreurs structurées** : format `{ "erreur": true, "phase": "...", "etape": "...", "page_id": "...", "message": "...", "detail": "..." }`
5. **Respecter les fallbacks documentés** : chaque phase a des comportements de repli définis dans le design. Les appliquer sans improviser

### Validation entrées/sorties

- Le format JSON de sortie de la phase scan DOIT contenir les 10 sections de base obligatoires (+ sections dynamiques conditionnelles en mode URL)
- Le format intermédiaire normalisé de la phase mapping DOIT contenir `criteres_rgaa_statuts` avec exactement 106 entrées
- Le `grille-instructions.json` de la phase grille Excel DOIT être validé avant appel au script `generate-xlsx.mjs`
- Toute NC dans `non_conformites` DOIT référencer un `page_id` existant dans `pages`

## Cohérence des rapports

### Vérification MD ↔ Excel

Après génération des deux rapports (Markdown et Excel), la phase d'agrégation DOIT :

1. Comparer les statuts RGAA entre le rapport MD et le JSON d'instructions Excel, **critère par critère et page par page**
2. Vérifier que les observations/modifications sont identiques pour chaque critère non conforme
3. Signaler toute divergence à l'utilisateur **avant livraison**
4. Ne jamais livrer des rapports incohérents sans avertissement explicite

### Source unique de vérité

Les deux phases de génération de rapports (MD et Excel) DOIVENT recevoir **exactement la même instance** du format intermédiaire normalisé global. Aucune copie, transformation ou filtrage intermédiaire n'est autorisé entre l'agrégation et la génération des rapports.

## Règles de développement

### Prompts agents

- Chaque prompt agent (.md) doit être autonome : il contient toutes les instructions nécessaires sans dépendance implicite
- Les formats JSON sont documentés dans les steering files et référencés par le prompt (pas dupliqués)
- Les comportements d'erreur et fallbacks doivent être explicitement listés

### Données de référence

- Les fichiers de référence JSON doivent avoir un header `meta` unifié (source, version, repository, url, generatedAt)
- Les versions des référentiels sont dans `a11y-audit-assistant/scripts/references-config.json`, jamais hardcodées ailleurs
- Le template ODS est au format ODS (pas xlsx), utilisé comme référence pour le formatage

### Tests

- Les tests de schéma JSON (zod) valident les contrats entre phases
- Les tests fast-check valident la logique déterministe de la phase mapping
- Les tests d'intégration utilisent des fixtures réalistes
- Aucun mock ne doit masquer un bug réel

## Arrêt sur compromis qualité

Si l'une des situations suivantes se présente, **ARRÊTER** et demander validation :

- Un agent ne peut pas valider ses sorties (schéma incomplet, données manquantes)
- La cohérence MD ↔ Excel ne peut pas être vérifiée
- Un fallback non documenté est nécessaire
- Un test doit être désactivé pour que le build passe
- Une exigence ne peut pas être satisfaite avec l'approche actuelle

_Exigences couvertes : 12.1, 12.2, 12.3, 12.4, 12.5_
