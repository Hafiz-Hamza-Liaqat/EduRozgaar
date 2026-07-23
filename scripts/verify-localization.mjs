#!/usr/bin/env node
/**
 * Enterprise localization verification (C.7.0.8)
 */
import { existsSync, readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  TRANSLATABLE_ENTITY_TYPES,
} from '../shared/localization/localeConfig.js';
import { normalizeLocale, resolveContentLocale } from '../shared/localization/localeResolver.js';
import { buildLocalizedPath, stripLocaleFromPath } from '../shared/localization/localeUtils.js';
import { mongoLocaleFilter } from '../shared/localization/localeFallback.js';
import { computeTranslationCompleteness } from '../shared/localization/translationStatus.js';
import { resolveLocalizedFormDefinition } from '../shared/formLocalization.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let passed = 0;
function pass(n) { passed += 1; }
function fail(n, d) { failures.push(`${n}${d ? `: ${d}` : ''}`); }
function exists(p) { return existsSync(join(root, p)); }
function read(p) { return readFileSync(join(root, p), 'utf8'); }

function runNpm(script) {
  const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], {
    cwd: root, encoding: 'utf8', shell: true,
  });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
}

// Phase 1 — shared localization layer
for (const f of ['localeConfig.js', 'localeResolver.js', 'localeFallback.js', 'localeUtils.js', 'translationStatus.js', 'index.js']) {
  if (exists(`shared/localization/${f}`)) pass(`shared/localization/${f}`);
  else fail(`shared/localization/${f}`);
}

if (DEFAULT_LOCALE === 'en' && SUPPORTED_LOCALES.includes('ur')) pass('locale config defaults');
else fail('locale config defaults');

if (normalizeLocale('ur-PK') === 'ur' && buildLocalizedPath('/about', 'ur') === '/ur/about') pass('locale utils');
else fail('locale utils');

if (stripLocaleFromPath('/ur/about').locale === 'ur' && stripLocaleFromPath('/about').path === '/about') pass('locale routing utils');
else fail('locale routing utils');

if (mongoLocaleFilter('en').$or && mongoLocaleFilter('ur').locale === 'ur') pass('mongo locale filter');
else fail('mongo locale filter');

// Phase 2-3 — models & translation service
{
  const blog = read('server/src/models/Blog.js');
  if (blog.includes('translationFieldDefinition') || blog.includes('translationGroupId')) pass('Blog translation fields');
  else fail('Blog translation fields');

  if (exists('server/src/services/localization/TranslationService.js')) pass('TranslationService');
  else fail('TranslationService');

  if (TRANSLATABLE_ENTITY_TYPES.length >= 8) pass('translatable entity types');
  else fail('translatable entity types');
}

// Phase 4 — localized slugs
{
  const slug = read('server/src/services/slugService.js');
  if (slug.includes('localeSlugCompoundFilter') && slug.includes('buildLocalizedSlugUrl')) pass('SlugService locale');
  else fail('SlugService locale');
}

// Phase 7 — workflow locale
{
  const wf = read('server/src/models/EditorialWorkflow.js');
  if (wf.includes('locale:') && wf.includes('entityType: 1, entityId: 1, locale: 1')) pass('workflow locale index');
  else fail('workflow locale index');
}

// Phase 8-9 — search & analytics
{
  const mappers = read('server/src/services/search/documentMappers.js');
  if (mappers.includes('docLocale') && mappers.includes('buildLocalizedSlugUrl')) pass('search locale mappers');
  else fail('search locale mappers');

  const analytics = read('server/src/models/AnalyticsEvent.js');
  if (analytics.includes("locale: { type: String")) pass('analytics locale field');
  else fail('analytics locale field');
}

// Phase 10-11 — forms & dynamic blocks
{
  const form = resolveLocalizedFormDefinition({
    name: 'Contact',
    fields: [{ id: '1', name: 'email', label: 'Email', type: 'email' }],
    translations: { ur: { name: 'رابطہ', fields: { 1: { label: 'ای میل' } } } },
  }, 'ur');
  if (form?.fields?.[0]?.label === 'ای میل') pass('form localization');
  else fail('form localization');

  const dyn = read('server/src/services/dynamicContent/DynamicContentService.js');
  if (dyn.includes('mongoLocaleFilter') && dyn.includes('buildLocalizedSlugUrl')) pass('dynamic blocks locale');
  else fail('dynamic blocks locale');
}

// Phase 12 — media metadata
{
  const media = read('server/src/models/MediaAsset.js');
  if (media.includes('localizedMetadata')) pass('media localized metadata');
  else fail('media localized metadata');
}

// Phase 13-14 — admin & public UX
{
  if (exists('client/src/components/admin/TranslationToolbar.jsx')) pass('TranslationToolbar');
  else fail('TranslationToolbar');
  if (exists('client/src/layouts/LocaleMainLayout.jsx')) pass('LocaleMainLayout');
  else fail('LocaleMainLayout');
  const routes = read('client/src/routes/index.jsx');
  if (routes.includes('LocaleMainLayout') && routes.includes("path: '/:locale'")) pass('locale routes');
  else fail('locale routes');
  const sw = read('client/src/components/i18n/LanguageSwitcher.jsx');
  if (sw.includes('localizedPathFor')) pass('language switcher navigation');
  else fail('language switcher navigation');
}

// Phase 15 — RTL readiness
{
  const ctx = read('client/src/context/LanguageContext.jsx');
  if (ctx.includes('document.documentElement.dir')) pass('RTL dir on html');
  else fail('RTL dir on html');
}

// No duplicate locale logic in cmsHelpers
{
  const cms = read('server/src/utils/cmsHelpers.js');
  if (cms.includes("from '../../../shared/localization/localeResolver.js'") && !cms.match(/CMS_LOCALES\s*=\s*\[/)) pass('cmsHelpers delegates locale');
  else fail('cmsHelpers delegates locale');
}

if (computeTranslationCompleteness([{ locale: 'en', translationStatus: 'published' }]).percent === 50) pass('translation completeness');
else fail('translation completeness');

// Regression gates
for (const script of ['verify:integration', 'verify:search', 'verify:workflow']) {
  const { ok, out } = runNpm(script);
  if (ok) pass(`npm run ${script}`);
  else fail(`npm run ${script}`, out.split('\n').slice(-2).join(' '));
}

console.log(`\nLocalization verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.error('  ✗', f));
  process.exit(1);
}
console.log('Enterprise localization checks passed.');
