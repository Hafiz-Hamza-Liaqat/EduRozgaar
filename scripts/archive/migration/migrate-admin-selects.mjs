#!/usr/bin/env node
/**
 * Migrate admin <select> elements to AdminSelectBare from AdminFormFields.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const IMPORT_LINE = "import { AdminSelectBare, adminFieldClass } from '../../components/admin/AdminFormFields';";
const IMPORT_LINE_COMPONENTS = "import { AdminSelectBare, adminFieldClass } from '../admin/AdminFormFields';";

const targets = [
  'client/src/pages/Admin',
  'client/src/components/admin',
].map((p) => path.join(root, p));

const selectClassPattern = /className="[^"]*(?:adminFieldClass|border-gray-300 dark:border-gray-600|border text-sm)[^"]*"/;

function processFile(filePath) {
  if (filePath.includes('AdminFormFields.jsx')) return false;
  let src = fs.readFileSync(filePath, 'utf8');
  if (!src.includes('<select')) return false;

  const isComponent = filePath.includes(`${path.sep}components${path.sep}admin${path.sep}`);
  const importLine = isComponent ? IMPORT_LINE_COMPONENTS : IMPORT_LINE;

  if (!src.includes('AdminSelectBare')) {
    if (src.includes("from '../../components/admin/AdminImageUrlField'")) {
      src = src.replace(
        /import \{([^}]*)\} from '\.\.\/\.\.\/components\/admin\/AdminImageUrlField';/,
        (m, imports) => {
          const parts = imports.split(',').map((s) => s.trim()).filter(Boolean);
          if (!parts.includes('adminFieldClass') && src.includes('adminFieldClass')) parts.push('adminFieldClass');
          const unique = [...new Set(parts)];
          return `import { ${unique.join(', ')} } from '../../components/admin/AdminImageUrlField';\n${importLine}`;
        }
      );
    } else if (src.includes("from '../admin/AdminImageUrlField'")) {
      src = src.replace(
        /import \{([^}]*)\} from '\.\.\/admin\/AdminImageUrlField';/,
        (m, imports) => `import { ${imports} } from '../admin/AdminImageUrlField';\n${IMPORT_LINE_COMPONENTS}`
      );
    } else {
      const firstImport = src.indexOf('import ');
      if (firstImport >= 0) {
        const lineEnd = src.indexOf('\n', firstImport);
        src = `${src.slice(0, lineEnd + 1)}${importLine}\n${src.slice(lineEnd + 1)}`;
      }
    }
  }

  src = src.replace(/<select(\s)/g, '<AdminSelectBare$1');
  src = src.replace(/<\/select>/g, '</AdminSelectBare>');

  // Remove duplicate adminFieldClass-only className on AdminSelectBare when using default
  src = src.replace(
    /<AdminSelectBare([^>]*?)className=\{adminFieldClass\}/g,
    '<AdminSelectBare$1'
  );
  src = src.replace(
    /<AdminSelectBare([^>]*?)className="[^"]*border-gray-300 dark:border-gray-600[^"]*"/g,
    '<AdminSelectBare$1'
  );

  fs.writeFileSync(filePath, src);
  return true;
}

let count = 0;
for (const dir of targets) {
  if (!fs.existsSync(dir)) continue;
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.name.endsWith('.jsx') && processFile(full)) {
        console.log('Updated:', path.relative(root, full));
        count += 1;
      }
    }
  };
  walk(dir);
}
console.log(`\nMigrated ${count} files.`);
