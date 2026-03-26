#!/usr/bin/env node
/**
 * Downloads accessibility references from official GitHub repos and writes
 * them locally with a unified header.
 *
 * Config:  scripts/references-config.json
 * Output:  references/*.json
 * Usage:   node scripts/update-references.mjs   (or: npm run update-refs)
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(readFileSync(join(__dirname, "references-config.json"), "utf-8"));
const OUT = join(__dirname, "..", "references");
mkdirSync(OUT, { recursive: true });

// ─── Helpers ────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: { "User-Agent": "a11y-ref-updater" } });
    if (res.ok) return res.text();
    if (res.status === 403 || res.status === 429) {
      const wait = (i + 1) * 5000;
      console.warn(`  ⏳ Rate limited (${res.status}), waiting ${wait / 1000}s…`);
      await sleep(wait);
      continue;
    }
    throw new Error(`HTTP ${res.status} – ${url}`);
  }
  throw new Error(`Failed after ${retries} retries – ${url}`);
}

async function fetchJSON(url) {
  return JSON.parse(await fetchText(url));
}

function rawURL(repo, branch, path) {
  // repo = "https://github.com/org/name"
  const slug = repo.replace("https://github.com/", "");
  return `https://raw.githubusercontent.com/${slug}/${branch}/${path}`;
}

function writeRef(filename, cfg, data) {
  const meta = {
    source: cfg.source,
    version: cfg.version,
    repository: cfg.repository,
    url: cfg.url,
    generatedAt: new Date().toISOString(),
  };
  writeFileSync(`${OUT}/${filename}`, JSON.stringify({ meta, data }, null, 2), "utf-8");
  console.log(`  ✓ ${OUT}/${filename}`);
}

function stripHTML(html) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── 1. RGAA ────────────────────────────────────────────────────────────────

async function downloadRGAA() {
  const c = CFG.rgaa;
  console.log(`\n📥 RGAA ${c.version}`);

  for (const [key, file] of Object.entries(c.files)) {
    console.log(`  Fetching ${file}…`);
    const url = rawURL(c.repository, c.branch, `${c.basePath}/${file}`);
    const data = await fetchJSON(url);
    writeRef(`rgaa-${key}.json`, c, data);
  }
}

// ─── 2. WCAG ────────────────────────────────────────────────────────────────

/** Map from SC slug to its official WCAG number (X.Y.Z). */
const WCAG_NUMBER_MAP = {
  "non-text-content": "1.1.1",
  "audio-only-and-video-only-prerecorded": "1.2.1",
  "captions-prerecorded": "1.2.2",
  "audio-description-or-media-alternative-prerecorded": "1.2.3",
  "captions-live": "1.2.4",
  "audio-description-prerecorded": "1.2.5",
  "sign-language-prerecorded": "1.2.6",
  "extended-audio-description-prerecorded": "1.2.7",
  "media-alternative-prerecorded": "1.2.8",
  "audio-only-live": "1.2.9",
  "info-and-relationships": "1.3.1",
  "meaningful-sequence": "1.3.2",
  "sensory-characteristics": "1.3.3",
  "orientation": "1.3.4",
  "identify-input-purpose": "1.3.5",
  "identify-purpose": "1.3.6",
  "use-of-color": "1.4.1",
  "audio-control": "1.4.2",
  "contrast-minimum": "1.4.3",
  "resize-text": "1.4.4",
  "images-of-text": "1.4.5",
  "contrast-enhanced": "1.4.6",
  "low-or-no-background-audio": "1.4.7",
  "visual-presentation": "1.4.8",
  "images-of-text-no-exception": "1.4.9",
  "reflow": "1.4.10",
  "non-text-contrast": "1.4.11",
  "text-spacing": "1.4.12",
  "content-on-hover-or-focus": "1.4.13",
  "keyboard": "2.1.1",
  "no-keyboard-trap": "2.1.2",
  "keyboard-no-exception": "2.1.3",
  "character-key-shortcuts": "2.1.4",
  "timing-adjustable": "2.2.1",
  "pause-stop-hide": "2.2.2",
  "no-timing": "2.2.3",
  "interruptions": "2.2.4",
  "re-authenticating": "2.2.5",
  "timeouts": "2.2.6",
  "three-flashes-or-below-threshold": "2.3.1",
  "three-flashes": "2.3.2",
  "bypass-blocks": "2.4.1",
  "page-titled": "2.4.2",
  "focus-order": "2.4.3",
  "link-purpose-in-context": "2.4.4",
  "multiple-ways": "2.4.5",
  "headings-and-labels": "2.4.6",
  "focus-visible": "2.4.7",
  "location": "2.4.8",
  "link-purpose-link-only": "2.4.9",
  "section-headings": "2.4.10",
  "pointer-gestures": "2.5.1",
  "pointer-cancellation": "2.5.2",
  "label-in-name": "2.5.3",
  "motion-actuation": "2.5.4",
  "target-size-enhanced": "2.5.5",
  "concurrent-input-mechanisms": "2.5.6",
  "dragging-movements": "2.5.7",
  "target-size-minimum": "2.5.8",
  "language-of-page": "3.1.1",
  "language-of-parts": "3.1.2",
  "unusual-words": "3.1.3",
  "abbreviations": "3.1.4",
  "reading-level": "3.1.5",
  "pronunciation": "3.1.6",
  "on-focus": "3.2.1",
  "on-input": "3.2.2",
  "consistent-navigation": "3.2.3",
  "consistent-identification": "3.2.4",
  "change-on-request": "3.2.5",
  "consistent-help": "3.2.6",
  "error-identification": "3.3.1",
  "labels-or-instructions": "3.3.2",
  "error-suggestion": "3.3.3",
  "error-prevention-legal-financial-data": "3.3.4",
  "help": "3.3.5",
  "error-prevention-all": "3.3.6",
  "redundant-entry": "3.3.7",
  "accessible-authentication-minimum": "3.3.8",
  "accessible-authentication-enhanced": "3.3.9",
  "parsing": "4.1.1",
  "name-role-value": "4.1.2",
  "status-messages": "4.1.3",
  "focus-not-obscured-minimum": "2.4.11",
  "focus-not-obscured-enhanced": "2.4.12",
  "focus-appearance": "2.4.13",
};

function parseWcagSC(html, id, ver) {
  const titleMatch = html.match(/<h4>(.*?)<\/h4>/);
  const levelMatch = html.match(/<p class="conformance-level">(.*?)<\/p>/);
  const isNew = html.includes('class="sc new"');

  // Extract the first meaningful paragraph as description
  let description = "";
  const parts = html.split(/<\/p>/);
  for (const part of parts) {
    const cleaned = part.replace(/<p[^>]*>/g, "").trim();
    if (cleaned && !cleaned.match(/^(A{1,3})$/) && cleaned !== "New" && !cleaned.includes("conformance-level")) {
      description = stripHTML(cleaned);
      break;
    }
  }

  const versionLabel = ver === "20" ? "2.0" : ver === "21" ? "2.1" : "2.2";
  const number = WCAG_NUMBER_MAP[id] || null;

  return {
    id,
    number,
    title: titleMatch ? stripHTML(titleMatch[1]) : id,
    level: levelMatch ? levelMatch[1].trim() : "?",
    introducedIn: `WCAG ${versionLabel}`,
    isNew,
    description,
  };
}

async function downloadWCAG() {
  const c = CFG.wcag;
  console.log(`\n📥 WCAG ${c.version}`);

  const allSC = [];

  for (const [ver, ids] of Object.entries(c.successCriteria)) {
    for (const id of ids) {
      const url = rawURL(c.repository, c.branch, `${c.basePath}/${ver}/${id}.html`);
      try {
        const html = await fetchText(url);
        allSC.push(parseWcagSC(html, id, ver));
        await sleep(200);
      } catch (e) {
        console.warn(`  ⚠ Skipping ${id}: ${e.message}`);
      }
    }
    const vLabel = ver === "20" ? "2.0" : ver === "21" ? "2.1" : "2.2";
    console.log(`  ✓ WCAG ${vLabel}: ${ids.length} SC`);
  }

  writeRef("wcag-sc.json", c, allSC);
}

// ─── 3. ARIA APG ────────────────────────────────────────────────────────────

function extractSection(html, sectionId) {
  const re = new RegExp(`<section id="${sectionId}">([\\s\\S]*?)<\\/section>`);
  const m = html.match(re);
  return m ? m[1] : "";
}

function extractDescription(html) {
  const about = extractSection(html, "about");
  if (!about) return "";
  const paragraphs = about.match(/<p>([\s\S]*?)<\/p>/g);
  if (!paragraphs) return "";
  return paragraphs.slice(0, 2).map((p) => stripHTML(p)).join(" ");
}

function extractTitle(html) {
  const m = html.match(/<h1>(.*?)<\/h1>/);
  return m ? stripHTML(m[1]).replace(" Pattern", "") : "";
}

function extractKeyboard(html) {
  const section = extractSection(html, "keyboard_interaction");
  if (!section) return [];

  const items = [];
  const liRegex = /<li>\s*([\s\S]*?)\s*<\/li>/g;
  let m;
  while ((m = liRegex.exec(section)) !== null) {
    const li = m[1];
    const kbdMatch = li.match(/<kbd>(.*?)<\/kbd>/);
    if (!kbdMatch) continue;

    const beforeUl = li.split(/<ul>/)[0];
    const kbds = [];
    const kr = /<kbd>(.*?)<\/kbd>/g;
    let km;
    while ((km = kr.exec(beforeUl)) !== null) kbds.push(km[1]);

    const key = kbds.join(" + ");
    let action = stripHTML(beforeUl.replace(/<kbd>.*?<\/kbd>/g, ""));
    action = action.replace(/^[\s:–\-]+/, "").trim();

    if (key && action.length > 5) items.push({ key, action });
  }
  return items;
}

function extractAriaProps(html) {
  const section = extractSection(html, "roles_states_properties");
  if (!section) return [];
  const items = [];
  const liRegex = /<li>([\s\S]*?)<\/li>/g;
  let m;
  while ((m = liRegex.exec(section)) !== null) {
    const text = stripHTML(m[1]);
    if (text.length > 10) items.push(text);
  }
  return items;
}

async function downloadARIA() {
  const c = CFG.aria;
  console.log(`\n📥 ARIA APG ${c.version}`);

  const patterns = [];
  const overrides = c.fileOverrides || {};

  for (const id of c.patterns) {
    const filePath = overrides[id] || `${id}/${id}-pattern.html`;
    const url = rawURL(c.repository, c.branch, `${c.basePath}/${filePath}`);
    try {
      const html = await fetchText(url);
      patterns.push({
        id,
        name: extractTitle(html) || id,
        url: `https://www.w3.org/WAI/ARIA/apg/patterns/${id}/`,
        description: extractDescription(html),
        keyboardInteraction: extractKeyboard(html),
        ariaRolesStatesProperties: extractAriaProps(html),
      });
      await sleep(200);
    } catch (e) {
      console.warn(`  ⚠ Skipping ${id}: ${e.message}`);
    }
  }

  console.log(`  ✓ ${patterns.length} patterns parsed`);
  writeRef("aria-patterns.json", c, patterns);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔄 Updating accessibility references…");
  console.log(`   Config: scripts/references-config.json`);

  await downloadRGAA();
  await downloadWCAG();
  await downloadARIA();

  console.log(`\n✅ All references updated in ${OUT}/`);
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
