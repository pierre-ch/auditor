#!/usr/bin/env node

/**
 * check-deps.mjs — Vérification des prérequis du Power a11y-audit-assistant.
 * Exit: 0 = OK, 1 = bloquant manquant, 2 = consentement requis
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statfsSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const OS = platform();
const SYM = { ok: '✓', block: '✗', warn: '⚠' };

function tryExec(cmd) {
  try { return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim(); }
  catch { return null; }
}

function tryJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf-8')); }
  catch { return null; }
}

function line(sym, label, detail) {
  console.log(`  ${sym} ${label}${detail ? `  (${detail})` : ''}`);
}

// ── Checks ──

function checkNode() {
  const v = tryExec('node --version');
  return { ok: !!v, detail: v };
}

function checkNodeFetch() {
  const r = tryExec('node -e "console.log(typeof fetch)"');
  return { ok: r === 'function', detail: r === 'function' ? 'disponible' : 'Node.js >= 18 requis' };
}

function checkPlaywright() {
  const paths = [
    // Kiro project-level config
    join(ROOT, '..', '.kiro', 'settings', 'mcp.json'),
    // Kiro user-level config
    join(homedir(), '.kiro', 'settings', 'mcp.json'),
    // Kiro workspace root
    join(ROOT, '..', '.kiro', 'mcp.json'),
  ];
  for (const p of paths) {
    const json = tryJson(p);
    if (!json?.mcpServers) continue;
    for (const [k, v] of Object.entries(json.mcpServers)) {
      const s = `${k} ${v?.command ?? ''} ${(v?.args ?? []).join(' ')}`.toLowerCase();
      if (s.includes('playwright')) return { ok: true, detail: p };
    }
  }
  return { ok: false, detail: null };
}

function checkRefs() {
  const refs = [
    { path: 'references/rgaa-criteres.json', label: 'rgaa-criteres.json', key: 'topics' },
    { path: 'references/wcag-sc.json', label: 'wcag-sc.json', key: null },
    { path: 'references/aria-patterns.json', label: 'aria-patterns.json', key: null },
    { path: 'references/mapping-rgaa-wcag-eaa.json', label: 'mapping-rgaa-wcag-eaa.json', key: null },
  ];
  return refs.map(r => {
    const json = tryJson(join(ROOT, r.path));
    const hasMeta = json?.meta != null;
    const version = json?.meta?.version ?? json?.meta?.counts?.total_rgaa;
    const ok = hasMeta && version != null;
    return { label: r.label, ok, detail: ok ? (json.meta.version ? `v${json.meta.version}` : `${version} critères`) : 'absent ou invalide' };
  });
}

function checkNonJsonRefs() {
  const files = [
    { path: 'references/rapport-template.md', label: 'rapport-template.md' },
    { path: 'references/thematiques-guide.md', label: 'thematiques-guide.md' },
    { path: 'references/criteres-revue-manuelle.md', label: 'criteres-revue-manuelle.md' },
  ];
  return files.map(f => {
    const ok = existsSync(join(ROOT, f.path));
    return { label: f.label, ok, detail: ok ? 'présent' : 'absent' };
  });
}

function checkExceljs() {
  const v = tryExec('node -e "console.log(require(\'exceljs/package.json\').version)"');
  return { ok: !!v, detail: v ? `v${v}` : 'non installé → npm install exceljs' };
}

function checkOds() {
  return { ok: existsSync(join(ROOT, 'references/rgaa4.1.2.modele-de-grille-d-audit.ods')) };
}

function checkEaa() {
  return { ok: existsSync(join(ROOT, 'references/eaa-references.json')) };
}

function checkDisk() {
  try {
    const s = statfsSync(ROOT);
    const mb = Math.floor((s.bavail * s.bsize) / 1048576);
    return { ok: mb >= 100, detail: `${mb} Mo` };
  } catch { return { ok: true, detail: 'non vérifiable' }; }
}

// ── Main ──

const osLabel = OS === 'win32' ? 'Windows' : OS === 'darwin' ? 'macOS' : 'Linux';
console.log(`\n🔍 Prérequis — a11y-audit-assistant (${osLabel})\n`);

let hasBlock = false, hasConsent = false;

console.log('── Bloquants ──');
const node = checkNode();
line(node.ok ? SYM.ok : SYM.block, 'Node.js', node.detail);
if (!node.ok) hasBlock = true;

const fetch_ = checkNodeFetch();
line(fetch_.ok ? SYM.ok : SYM.block, 'Node.js fetch()', fetch_.detail);
if (!fetch_.ok) hasBlock = true;

const pw = checkPlaywright();
line(pw.ok ? SYM.ok : SYM.block, 'Playwright MCP', pw.ok ? 'trouvé' : 'config introuvable');
if (!pw.ok) hasBlock = true;

for (const r of checkRefs()) {
  line(r.ok ? SYM.ok : SYM.block, r.label, r.detail);
  if (!r.ok) hasBlock = true;
}

for (const r of checkNonJsonRefs()) {
  line(r.ok ? SYM.ok : SYM.block, r.label, r.detail);
  if (!r.ok) hasBlock = true;
}

const xl = checkExceljs();
line(xl.ok ? SYM.ok : SYM.block, 'exceljs', xl.detail);
if (!xl.ok) hasBlock = true;

console.log('\n── Consentement ──');
const ods = checkOds();
line(ods.ok ? SYM.ok : SYM.warn, 'Template ODS (référence visuelle)', ods.ok ? 'présent' : 'absent — référence formatage DINUM indisponible');
if (!ods.ok) hasConsent = true;

console.log('\n── Avertissements ──');
const eaa = checkEaa();
line(eaa.ok ? SYM.ok : SYM.warn, 'eaa-references.json', eaa.ok ? 'disponible' : 'absent');

const disk = checkDisk();
line(disk.ok ? SYM.ok : SYM.warn, 'Espace disque', disk.detail);

console.log('\n── Résumé ──');
if (hasBlock) { console.log(`  ${SYM.block} Prérequis bloquants manquants.\n`); process.exit(1); }
if (hasConsent) { console.log(`  ${SYM.warn} Consentement requis.\n`); process.exit(2); }
console.log(`  ${SYM.ok} Prêt pour l'audit.\n`);
