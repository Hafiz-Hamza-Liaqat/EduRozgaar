#!/usr/bin/env node
/**
 * Post-build SEO prerender — injects route-specific title/description into dist HTML shells.
 * Run after `npm run build` in client/.
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '../client/dist');
const INDEX = path.join(DIST, 'index.html');

const ROUTES = [
  { path: '/', title: 'Strideto – Jobs & Education Portal Pakistan', description: "Pakistan's job and education portal." },
  { path: '/jobs', title: 'Jobs in Pakistan', description: 'Find latest jobs in Pakistan.' },
  { path: '/scholarships', title: 'Scholarships in Pakistan', description: 'Find scholarships for Pakistani students.' },
  { path: '/admissions', title: 'Admissions in Pakistan', description: 'University and college admissions.' },
  { path: '/about', title: 'About Strideto', description: 'About Strideto student-first mission.' },
  { path: '/contact', title: 'Contact Strideto', description: 'Contact Strideto support.' },
];

async function main() {
  const baseHtml = await fs.readFile(INDEX, 'utf8');
  for (const route of ROUTES) {
    let html = baseHtml;
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`);
    if (html.includes('name="description"')) {
      html = html.replace(/content="[^"]*"(\s*name="description")/, `content="${route.description}"$1`);
    }
    const outDir = route.path === '/' ? DIST : path.join(DIST, route.path.slice(1));
    await fs.mkdir(outDir, { recursive: true });
    const outFile = route.path === '/' ? INDEX : path.join(outDir, 'index.html');
    await fs.writeFile(outFile, html);
  }
  console.log(`Prerendered ${ROUTES.length} SEO shells into dist/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
