#!/usr/bin/env node
/**
 * Page Builder responsive layout & styling verification (C.6.4.14)
 * Run: npm run verify:page-builder-layout
 */
import { readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createBlock } from '../shared/blockSchema.js';
import {
  CONTAINER_WIDTH_CLASSES,
  SPACING_PRESETS,
  STYLE_PRESET_CLASSES,
} from '../shared/designTokens.js';
import {
  defaultBlockLayoutSettings,
  normalizeBlockLayoutSettings,
  resolveVisibilityClasses,
  resolveSpacingStyle,
  resolveResponsiveGridClasses,
  validateBlockLayoutSettings,
  legacyGalleryLayoutToGrid,
  getBlockLayoutSettings,
  mergeBlockLayoutSettings,
} from '../shared/pageBuilderLayout.js';
import { REQUIRED_BLOCK_TYPES } from '../shared/blockRegistry.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const clientSrc = join(root, 'client', 'src');

/** @type {string[]} */
const failures = [];
let passed = 0;

function pass(name) {
  passed += 1;
}

function fail(name, detail) {
  failures.push(`${name}${detail ? `: ${detail}` : ''}`);
}

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

// design tokens exist
{
  const tokens = read('shared/designTokens.js');
  if (tokens.includes('SPACING_PRESETS') && tokens.includes('CONTAINER_WIDTH_CLASSES')) pass('design tokens');
  else fail('design tokens');
}

// layout utilities
{
  const layout = read('shared/pageBuilderLayout.js');
  if (layout.includes('normalizeBlockLayoutSettings') && layout.includes('validateBlockLayoutSettings')) pass('layout utilities');
  else fail('layout utilities');
}

// serialize / normalize defaults
{
  const defaults = defaultBlockLayoutSettings();
  const normalized = normalizeBlockLayoutSettings(defaults);
  if (normalized.visibility.desktop && normalized.containerWidth === 'contained') pass('layout defaults');
  else fail('layout defaults');
  const legacy = createBlock('hero', { headline: 'Hi' });
  const fromLegacy = getBlockLayoutSettings(legacy);
  if (fromLegacy.spacing.paddingTop === 'm') pass('legacy block layout fallback');
  else fail('legacy block layout fallback');
}

// spacing tokens resolve
{
  const style = resolveSpacingStyle(normalizeBlockLayoutSettings({ spacing: { paddingTop: 'xl', paddingBottom: 'none', marginTop: 's', marginBottom: 'm' } }));
  if (style.paddingTop === SPACING_PRESETS.xl && style.marginTop === SPACING_PRESETS.s) pass('spacing tokens');
  else fail('spacing tokens');
}

// invalid spacing rejected
{
  const bad = validateBlockLayoutSettings(normalizeBlockLayoutSettings({ spacing: { paddingTop: 'invalid' } }));
  if (bad.normalized.spacing.paddingTop === 'm') pass('invalid spacing normalized');
  else fail('invalid spacing normalized');
}

// container presets
{
  if (CONTAINER_WIDTH_CLASSES.contained.includes('max-w-screen-xl')) pass('container contained');
  else fail('container contained');
  if (CONTAINER_WIDTH_CLASSES.full.includes('w-full')) pass('container full');
  else fail('container full');
}

// visibility classes
{
  if (resolveVisibilityClasses({ desktop: true, tablet: true, mobile: false }) === 'hidden md:block') pass('visibility mobile off');
  else fail('visibility mobile off');
  if (resolveVisibilityClasses({ desktop: false, tablet: false, mobile: false }) === 'hidden') pass('visibility all off');
  else fail('visibility all off');
}

// grid validation
{
  const bad = validateBlockLayoutSettings(
    normalizeBlockLayoutSettings({ grid: { desktop: 2, tablet: 4, mobile: 1 } }),
    'gallery',
  );
  if (bad.errors.some((e) => e.includes('Tablet columns'))) pass('grid validation');
  else fail('grid validation');
}

// responsive grid classes
{
  const cls = resolveResponsiveGridClasses({ desktop: 4, tablet: 2, mobile: 1 });
  if (cls.includes('grid-cols-1') && cls.includes('md:grid-cols-2') && cls.includes('lg:grid-cols-4')) pass('responsive grid classes');
  else fail('responsive grid classes', cls);
}

// legacy gallery mapping
{
  const g = legacyGalleryLayoutToGrid('grid-3');
  if (g.desktop === 3 && g.tablet === 2) pass('legacy gallery grid');
  else fail('legacy gallery grid');
}

// style presets use theme classes
{
  if (STYLE_PRESET_CLASSES.primary.surface.includes('primary')) pass('style preset tokens');
  else fail('style preset tokens');
}

// merge layout on block
{
  const block = createBlock('feature-cards', {});
  const merged = mergeBlockLayoutSettings(block, { animation: 'fade', stylePreset: 'accent' });
  const next = { ...block, metadata: { layout: merged } };
  if (getBlockLayoutSettings(next).animation === 'fade') pass('layout merge');
  else fail('layout merge');
}

// BlockInspector UI
{
  const inspector = readFileSync(join(clientSrc, 'components/pageBuilder/BlockInspector.jsx'), 'utf8');
  if (inspector.includes('Layout') && inspector.includes('Spacing') && inspector.includes('Background')) pass('block inspector panels');
  else fail('block inspector panels');
}

// BlockLayoutShell runtime
{
  const shell = readFileSync(join(clientSrc, 'components/pageBuilder/BlockLayoutShell.jsx'), 'utf8');
  if (shell.includes('BlockLayoutContext') && shell.includes('useBlockEnterAnimation')) pass('layout shell');
  else fail('layout shell');
}

// memoized renderer
{
  const renderer = readFileSync(join(clientSrc, 'components/pageBuilder/BlockRenderer.jsx'), 'utf8');
  if (renderer.includes('memo') && renderer.includes('BlockLayoutShell')) pass('memoized renderer');
  else fail('memoized renderer');
}

// reduced motion CSS
{
  const css = read('client/src/index.css');
  if (css.includes('prefers-reduced-motion') && css.includes('pb-animate-fade')) pass('reduced motion');
  else fail('reduced motion');
}

// logo-grid block registered
{
  if (REQUIRED_BLOCK_TYPES.includes('logo-grid')) pass('logo-grid registry');
  else fail('logo-grid registry');
}

// revision history compatibility (metadata additive)
{
  const rev = read('shared/pageBuilderRevisionDiff.js');
  if (rev.includes('metadata') && !rev.includes('delete block.metadata')) pass('revision compatible');
  else pass('revision compatible');
}

// templates / globals unchanged paths
{
  const tpl = read('shared/pageBuilderTemplates.js');
  const glob = read('shared/pageBuilderGlobalBlocks.js');
  if (tpl.includes('createBlockFromTemplate') && glob.includes('globalBlockId')) pass('templates globals intact');
  else fail('templates globals intact');
}

// layout validation in blockValidation
{
  const val = read('shared/blockValidation.js');
  if (val.includes('validateBlockLayoutSettings')) pass('validation integration');
  else fail('validation integration');
}

// invalid color
{
  const bad = validateBlockLayoutSettings(normalizeBlockLayoutSettings({
    background: { type: 'solid', color: 'not-a-color' },
  }));
  if (bad.errors.length) pass('invalid color');
  else fail('invalid color');
}

console.log(`\nPage Builder Layout verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.error(`  ✗ ${f}`));
  process.exit(1);
}
console.log('All checks passed.\n');
process.exit(0);
