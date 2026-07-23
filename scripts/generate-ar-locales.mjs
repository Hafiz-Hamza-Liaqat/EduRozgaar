import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '../client/src/i18n/locales');
const enDir = path.join(localesDir, 'en');
const arDir = path.join(localesDir, 'ar');

if (!fs.existsSync(arDir)) fs.mkdirSync(arDir, { recursive: true });

const files = fs.readdirSync(enDir).filter((f) => f.endsWith('.json'));

for (const file of files) {
  const en = JSON.parse(fs.readFileSync(path.join(enDir, file), 'utf8'));
  const ar = {};
  for (const [key, value] of Object.entries(en)) {
    ar[key] = typeof value === 'string' ? `[AR] ${value}` : value;
  }
  fs.writeFileSync(path.join(arDir, file), `${JSON.stringify(ar, null, 2)}\n`);
}

console.log(`Generated ${files.length} Arabic placeholder locale files.`);
