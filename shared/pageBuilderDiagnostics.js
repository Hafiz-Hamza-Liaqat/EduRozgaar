/**
 * Page Builder diagnostics (C.6.4.15).
 */
import { getBlockDefinition } from './blockRegistry.js';
import { getPageValidationSummary } from './blockValidation.js';
import { auditPageAccessibility } from './pageBuilderAccessibility.js';
import { parseJsonArray } from './blockSchema.js';
import { validatePageBuilderSeo, resolvePageBuilderSeo } from './pageBuilderSeo.js';
import { validateBlockIdStability } from './pageBuilderEditorOps.js';

const HEAVY_BLOCK_TYPES = new Set(['gallery', 'feature-cards', 'logo-grid', 'featured-jobs', 'featured-scholarships', 'featured-admissions']);

/**
 * @param {import('./blockSchema.js').PageBlock[]} blocks
 * @param {{ globalMap?: Map<string, object>; title?: string; pageKey?: string }} [options]
 */
export function computePageBuilderDiagnostics(blocks, options = {}) {
  const globalMap = options.globalMap;
  const list = blocks || [];
  const enabled = list.filter((b) => b.enabled !== false);
  const disabled = list.filter((b) => b.enabled === false);

  const validation = getPageValidationSummary(list, { globalMap, includeDisabled: true });
  const a11y = auditPageAccessibility(list);

  const globalRefs = list.filter((b) => b.globalBlockId).length;
  const idCheck = validateBlockIdStability(list);

  /** @type {string[]} */
  const missingImages = [];
  /** @type {string[]} */
  const missingAlt = [];
  /** @type {string[]} */
  const brokenLinks = [];

  for (const block of list) {
    const def = getBlockDefinition(block.type);
    const label = def?.displayName || block.type;
    const cfg = block.config || {};

    if (block.type === 'gallery') {
      if (cfg.mode === 'single') {
        if (!cfg.imageUrl) missingImages.push(`${label}: single image URL missing`);
        else if (!cfg.altText) missingAlt.push(`${label}: alt text missing`);
      } else {
        parseJsonArray(cfg.imagesJson).forEach((img, i) => {
          if (!img?.url) missingImages.push(`${label}: image ${i + 1} URL missing`);
          if (img?.url && !img?.alt) missingAlt.push(`${label}: image ${i + 1} alt missing`);
        });
      }
    }

    if (block.type === 'logo-grid') {
      parseJsonArray(cfg.logosJson).forEach((logo, i) => {
        if (!logo?.url) missingImages.push(`${label}: logo ${i + 1} URL missing`);
        if (logo?.url && !logo?.alt && !logo?.decorative) missingAlt.push(`${label}: logo ${i + 1} alt missing`);
      });
    }

    const urlFields = ['primaryCtaUrl', 'secondaryCtaUrl', 'buttonUrl', 'canonicalUrl', 'backgroundImageUrl', 'imageUrl'];
    for (const key of urlFields) {
      const val = cfg[key];
      if (val && typeof val === 'string' && !/^https?:\/\//i.test(val) && !val.startsWith('/')) {
        brokenLinks.push(`${label}: ${key} may be invalid`);
      }
    }
  }

  const renderWeight = enabled.reduce((sum, b) => sum + (HEAVY_BLOCK_TYPES.has(b.type) ? 3 : 1), 0);
  const approxBytes = JSON.stringify(list).length;
  const unusedBlocks = disabled.length;

  const seo = resolvePageBuilderSeo({
    layout: { title: options.title, pageKey: options.pageKey, blocks: list },
    blocks: list,
    canonical: options.canonical || '/',
    preview: false,
  });
  const seoCheck = validatePageBuilderSeo(seo);

  return {
    totals: {
      blocks: list.length,
      enabled: enabled.length,
      disabled: disabled.length,
      globalReferences: globalRefs,
      templateReferences: 0,
    },
    validation: {
      errors: validation.errors,
      warnings: validation.warnings,
      invalidCount: validation.invalidCount,
      warningCount: validation.warningCount,
      canPublish: validation.canPublish,
    },
    accessibility: {
      errors: a11y.errors,
      warnings: a11y.warnings,
      pass: a11y.pass,
      auditedBlocks: a11y.auditedBlocks,
    },
    seo: {
      errors: seoCheck.errors,
      warnings: seoCheck.warnings,
      ok: seoCheck.ok,
    },
    ids: idCheck,
    missingImages,
    missingAlt,
    brokenLinks,
    unusedBlocks,
    renderWeight,
    estimatedPageSizeKb: Math.round((approxBytes / 1024) * 10) / 10,
    canPublish: validation.canPublish && a11y.pass && idCheck.ok,
  };
}
