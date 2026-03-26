#!/usr/bin/env node
/**
 * validate-grille.mjs — Validates grille-instructions.json before passing to generate-xlsx.mjs
 *
 * Usage: node scripts/validate-grille.mjs <grille-instructions.json>
 * Exit:  0 = valid, 1 = errors found
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const [,, inputPath] = process.argv;

if (!inputPath) {
  console.error('Usage: node scripts/validate-grille.mjs <grille-instructions.json>');
  process.exit(1);
}

const VALID_STATUTS = ['C', 'NC', 'NA', 'NT'];
const VALID_DEROGATION = ['N', 'O'];
const EXPECTED_CRITERES = 106;
const THEMATIQUES = [
  'Images', 'Cadres', 'Couleurs', 'Multimédia', 'Tableaux', 'Liens',
  'Scripts', 'Éléments obligatoires', 'Structuration', 'Présentation',
  'Formulaires', 'Navigation', 'Consultation'
];

const errors = [];
const warnings = [];

function err(msg) { errors.push(`✗ ${msg}`); }
function warn(msg) { warnings.push(`⚠ ${msg}`); }

let data;
try {
  data = JSON.parse(readFileSync(resolve(inputPath), 'utf8'));
} catch (e) {
  console.error(`✗ JSON invalide: ${e.message}`);
  process.exit(1);
}

// Structure checks
if (!data.pages || !Array.isArray(data.pages)) {
  err('Champ "pages" manquant ou non-tableau');
} else if (data.pages.length === 0) {
  err('Aucune page dans "pages"');
} else {
  const pageIds = new Set();

  for (const page of data.pages) {
    if (!page.id) err(`Page sans "id"`);
    if (!page.nom) err(`Page ${page.id || '?'} sans "nom"`);
    if (pageIds.has(page.id)) err(`Page "${page.id}" en doublon`);
    pageIds.add(page.id);

    if (!page.criteres || !Array.isArray(page.criteres)) {
      err(`Page ${page.id}: "criteres" manquant ou non-tableau`);
      continue;
    }

    if (page.criteres.length !== EXPECTED_CRITERES) {
      err(`Page ${page.id}: ${page.criteres.length} critères au lieu de ${EXPECTED_CRITERES}`);
    }

    const thematiquesVues = new Set();

    for (const c of page.criteres) {
      if (!c.critere) err(`Page ${page.id}: critère sans numéro`);
      if (!c.thematique) err(`Page ${page.id}, critère ${c.critere || '?'}: thématique manquante`);
      else thematiquesVues.add(c.thematique);

      if (!c.recommandation) err(`Page ${page.id}, critère ${c.critere || '?'}: recommandation manquante`);

      if (!VALID_STATUTS.includes(c.statut)) {
        err(`Page ${page.id}, critère ${c.critere || '?'}: statut invalide "${c.statut}" (attendu: ${VALID_STATUTS.join(', ')})`);
      }

      if (c.derogation && !VALID_DEROGATION.includes(c.derogation)) {
        err(`Page ${page.id}, critère ${c.critere || '?'}: dérogation invalide "${c.derogation}" (attendu: N ou O)`);
      }

      if (c.statut === 'NC' && !c.modifications) {
        err(`Page ${page.id}, critère ${c.critere || '?'}: statut NC mais "modifications" vide`);
      }
    }

    for (const t of THEMATIQUES) {
      if (!thematiquesVues.has(t)) {
        warn(`Page ${page.id}: thématique "${t}" absente`);
      }
    }
  }
}

if (!data.metadata) {
  warn('Champ "metadata" manquant');
} else {
  if (!data.metadata.date_audit) warn('metadata.date_audit manquant');
  if (!data.metadata.versions?.rgaa) warn('metadata.versions.rgaa manquant');
}

// Report
console.log(`\n🔍 Validation grille-instructions.json\n`);

if (warnings.length) {
  console.log('── Avertissements ──');
  for (const w of warnings) console.log(`  ${w}`);
}

if (errors.length) {
  console.log('\n── Erreurs ──');
  for (const e of errors) console.log(`  ${e}`);
  console.log(`\n✗ ${errors.length} erreur(s), ${warnings.length} avertissement(s)\n`);
  process.exit(1);
} else {
  console.log(`\n✓ Valide — ${data.pages?.length || 0} page(s), ${warnings.length} avertissement(s)\n`);
}
