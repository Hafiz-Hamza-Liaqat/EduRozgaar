import fs from 'fs';
import path from 'path';

const root = path.join(import.meta.dirname, '..');
const dirs = [
  path.join(root, 'client/src/pages/Admin'),
  path.join(root, 'client/src/components/admin'),
];

const dup = /import \{ AdminSelectBare, adminFieldClass \} from '\.\.\/\.\.\/components\/admin\/AdminFormFields';/g;
const dup2 = /import \{ AdminSelectBare, adminFieldClass \} from '\.\.\/admin\/AdminFormFields';/g;
const replacement = "import { AdminSelectBare } from '../../components/admin/AdminFormFields';";
const replacement2 = "import { AdminSelectBare } from '../admin/AdminFormFields';";

for (const dir of dirs) {
  for (const ent of fs.readdirSync(dir)) {
    if (!ent.endsWith('.jsx')) continue;
    const file = path.join(dir, ent);
    let src = fs.readFileSync(file, 'utf8');
    const before = src;
    if (src.includes('AdminImageUrlField') && src.includes('adminFieldClass')) {
      src = src.replace(dup, replacement);
      src = src.replace(dup2, replacement2);
    }
    if (src !== before) {
      fs.writeFileSync(file, src);
      console.log('fixed', path.relative(root, file));
    }
  }
}
