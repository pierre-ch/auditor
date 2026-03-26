#!/usr/bin/env node
/**
 * generate-xlsx.mjs — Génère la grille RGAA Excel (.xlsx) à partir de grille-instructions.json
 * 
 * Usage : node scripts/generate-xlsx.mjs <grille-instructions.json> <sortie.xlsx>
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import ExcelJS from 'exceljs';

const [,, inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/generate-xlsx.mjs <grille-instructions.json> <sortie.xlsx>');
  process.exit(1);
}

const data = JSON.parse(readFileSync(resolve(inputPath), 'utf8'));

// Validation
if (!data.pages || !data.pages.length) {
  console.error('Erreur: aucune page dans grille-instructions.json');
  process.exit(1);
}

for (const page of data.pages) {
  if (page.criteres.length !== 106) {
    console.error(`Erreur: page ${page.id} contient ${page.criteres.length} critères au lieu de 106`);
    process.exit(1);
  }
  for (const c of page.criteres) {
    if (!['C', 'NC', 'NA', 'NT'].includes(c.statut)) {
      console.error(`Erreur: statut invalide "${c.statut}" pour critère ${c.critere}`);
      process.exit(1);
    }
    if (c.statut === 'NC' && !c.modifications) {
      console.error(`Erreur: critère ${c.critere} est NC mais modifications est vide`);
      process.exit(1);
    }
  }
}

const workbook = new ExcelJS.Workbook();
workbook.creator = 'a11y-audit-assistant';
workbook.created = new Date();

// Couleurs par statut
const statutColors = {
  'C':  { fill: '92D050', font: '000000' },  // Vert
  'NC': { fill: 'FF0000', font: 'FFFFFF' },  // Rouge
  'NA': { fill: 'BFBFBF', font: '000000' },  // Gris
  'NT': { fill: 'FFC000', font: '000000' },  // Orange
};

for (const page of data.pages) {
  const sheetName = `${page.id}-${page.nom}`.substring(0, 31);
  const sheet = workbook.addWorksheet(sheetName);

  // En-tête
  const header = data.metadata?.en_tete || 'RGAA 4.1.2 – GRILLE D\'ÉVALUATION';
  sheet.mergeCells('A1:G1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = header;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center' };

  // Info page
  sheet.mergeCells('A2:G2');
  sheet.getCell('A2').value = `Page: ${page.nom} — ${page.url || ''}`;
  sheet.getCell('A2').font = { italic: true, size: 10 };

  // Colonnes
  sheet.columns = [
    { key: 'thematique', width: 22 },
    { key: 'critere', width: 8 },
    { key: 'recommandation', width: 55 },
    { key: 'statut', width: 8 },
    { key: 'derogation', width: 12 },
    { key: 'modifications', width: 50 },
    { key: 'commentaires', width: 30 },
  ];

  // En-têtes colonnes (ligne 3)
  const headerRow = sheet.getRow(3);
  headerRow.values = ['Thématique', 'Critère', 'Recommandation', 'Statut', 'Dérogation', 'Modifications', 'Commentaires'];
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } };
  headerRow.alignment = { wrapText: true };

  // Données (à partir de la ligne 4)
  let currentThematique = '';
  page.criteres.forEach((c, i) => {
    const row = sheet.getRow(i + 4);
    row.values = [
      c.thematique,
      c.critere,
      c.recommandation,
      c.statut,
      c.derogation || 'N',
      c.modifications || '',
      c.commentaires || '',
    ];

    // Couleur du statut
    const sc = statutColors[c.statut];
    if (sc) {
      const statutCell = row.getCell(4);
      statutCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + sc.fill } };
      statutCell.font = { bold: true, color: { argb: 'FF' + sc.font } };
      statutCell.alignment = { horizontal: 'center' };
    }

    // Alternance couleur par thématique
    if (c.thematique !== currentThematique) {
      currentThematique = c.thematique;
    }

    row.alignment = { wrapText: true, vertical: 'top' };
  });

  // Bordures
  for (let r = 3; r <= page.criteres.length + 3; r++) {
    const row = sheet.getRow(r);
    for (let c = 1; c <= 7; c++) {
      row.getCell(c).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    }
  }

  // Figer la ligne d'en-tête
  sheet.views = [{ state: 'frozen', ySplit: 3 }];
  // Filtre auto
  sheet.autoFilter = { from: 'A3', to: 'G3' };
}

// Onglet synthèse
const synthSheet = workbook.addWorksheet('Synthèse');
synthSheet.columns = [
  { key: 'label', width: 30 },
  { key: 'value', width: 15 },
];
synthSheet.getRow(1).values = ['Indicateur', 'Valeur'];
synthSheet.getRow(1).font = { bold: true };

const allCriteres = data.pages.flatMap(p => p.criteres);
const cCount = allCriteres.filter(c => c.statut === 'C').length;
const ncCount = allCriteres.filter(c => c.statut === 'NC').length;
const naCount = allCriteres.filter(c => c.statut === 'NA').length;
const ntCount = allCriteres.filter(c => c.statut === 'NT').length;
const applicables = allCriteres.length - naCount;
const taux = applicables > 0 ? Math.round((cCount / (cCount + ncCount)) * 100) : 0;

const stats = [
  ['Date d\'audit', data.metadata?.date_audit || ''],
  ['Version RGAA', data.metadata?.versions?.rgaa || ''],
  ['Version WCAG', data.metadata?.versions?.wcag || ''],
  ['Total critères', allCriteres.length],
  ['Conformes (C)', cCount],
  ['Non conformes (NC)', ncCount],
  ['Non applicables (NA)', naCount],
  ['Non testés (NT)', ntCount],
  ['Critères applicables', applicables],
  ['Taux de conformité', `${taux}%`],
];

stats.forEach((s, i) => {
  synthSheet.getRow(i + 2).values = s;
});

await workbook.xlsx.writeFile(resolve(outputPath));
console.log(`Grille Excel générée: ${outputPath} (${data.pages.length} page(s), ${allCriteres.length} critères)`);
