import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Resolve sprint/ops docs whether they remain under docs/ or were archived.
 * Active RC docs stay at docs root. Historical sprint reports live under docs/archive.
 */
export function docExists(root, rel) {
  if (existsSync(join(root, rel))) return true;
  if (!rel.startsWith('docs/') || rel.includes('/archive/')) return false;
  const name = rel.slice('docs/'.length);
  return (
    existsSync(join(root, 'docs/archive/sprints', name)) ||
    existsSync(join(root, 'docs/archive/audits', name)) ||
    existsSync(join(root, 'docs/archive/qa', name))
  );
}
