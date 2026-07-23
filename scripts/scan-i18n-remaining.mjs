/**
 * Scan client/src for likely hardcoded UI strings in JSX.
 * Run: node scripts/scan-i18n-remaining.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, '../client/src');

const SKIP_DIRS = new Set(['i18n', 'constants', 'seo']);
const SKIP_PATTERNS = [
  /useTranslation/,
  /className=/,
  /import /,
  /from '/,
  /ROUTES\./,
  /https?:\/\//,
  /^\s*\/\//,
  /console\./,
  /aria-hidden/,
  /viewBox/,
  /strokeLinecap/,
  /d="/,
  /MIT License/,
  /Permission is hereby/,
];

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (!SKIP_DIRS.has(ent.name)) walk(full, files);
    } else if (/\.(jsx|js)$/.test(ent.name)) {
      files.push(full);
    }
  }
  return files;
}

const stringPattern = />([A-Za-z][A-Za-z0-9\s'’,.!?&–—:-]{4,})</g;
const attrPattern = /(?:placeholder|title|aria-label)=["']([A-Za-z][^"']{4,})["']/g;

const findings = [];

for (const file of walk(src)) {
  const rel = path.relative(src, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('useTranslation')) continue;
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (SKIP_PATTERNS.some((p) => p.test(line))) return;
    let m;
    while ((m = stringPattern.exec(line)) !== null) {
      findings.push({ file: rel, line: i + 1, text: m[1].trim(), type: 'jsx' });
    }
    while ((m = attrPattern.exec(line)) !== null) {
      findings.push({ file: rel, line: i + 1, text: m[1].trim(), type: 'attr' });
    }
  });
}

console.log(`Files without useTranslation scanned: ${walk(src).filter((f) => !fs.readFileSync(f, 'utf8').includes('useTranslation')).length}`);
console.log(`Potential hardcoded strings: ${findings.length}`);
findings.slice(0, 40).forEach((f) => console.log(`  ${f.file}:${f.line} [${f.type}] ${f.text}`));
if (findings.length > 40) console.log(`  ... and ${findings.length - 40} more`);
