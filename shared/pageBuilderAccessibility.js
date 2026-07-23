/**
 * Page Builder accessibility audit (C.6.4.15).
 * Shared rules for editor validation and production verification.
 */
import { parseJsonArray } from './blockSchema.js';
import { getBlockDefinition } from './blockRegistry.js';

/** @typedef {{ errors: string[]; warnings: string[]; pass: boolean }} A11yAuditResult */

/**
 * @param {import('./blockSchema.js').PageBlock} block
 * @param {import('./blockRegistry.js').BlockDefinition} [definition]
 */
export function auditBlockAccessibility(block, definition) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (!block?.enabled) {
    return { errors, warnings, pass: true };
  }

  definition = definition || getBlockDefinition(block.type);
  const cfg = block.config || {};
  const type = block.type;

  switch (type) {
    case 'hero': {
      if (!String(cfg.headline || '').trim()) errors.push('Hero: title/headline is required for screen readers');
      const hasPrimary = cfg.primaryCtaLabel && cfg.primaryCtaUrl;
      const hasSecondary = cfg.secondaryCtaLabel && cfg.secondaryCtaUrl;
      if (cfg.primaryCtaLabel && !cfg.primaryCtaUrl) warnings.push('Hero: primary CTA missing URL');
      if (cfg.secondaryCtaLabel && !cfg.secondaryCtaUrl) warnings.push('Hero: secondary CTA missing URL');
      if (hasPrimary || hasSecondary) {
        // links must have text — satisfied by labels
      }
      break;
    }
    case 'rich-text': {
      const html = String(cfg.htmlContent || cfg.body || '').replace(/<[^>]+>/g, '').trim();
      if (!html) errors.push('Rich text: content is empty');
      break;
    }
    case 'cta': {
      if (!String(cfg.buttonLabel || '').trim()) errors.push('CTA: button text is required');
      if (!String(cfg.buttonUrl || '').trim()) errors.push('CTA: button URL is required');
      break;
    }
    case 'faq': {
      const items = parseJsonArray(cfg.itemsJson).filter((i) => i?.question);
      if (!items.length) warnings.push('FAQ: no items for accordion');
      items.forEach((item, i) => {
        if (!String(item.question || '').trim()) errors.push(`FAQ item ${i + 1}: question required`);
        if (!String(item.answer || '').trim()) errors.push(`FAQ item ${i + 1}: answer required`);
      });
      break;
    }
    case 'gallery': {
      if ((cfg.mode || 'gallery') === 'single') {
        if (cfg.imageUrl && !String(cfg.altText || '').trim()) {
          errors.push('Gallery: alt text required for content image');
        }
      } else {
        parseJsonArray(cfg.imagesJson).forEach((img, i) => {
          if (img?.url && !String(img.alt || '').trim()) {
            errors.push(`Gallery image ${i + 1}: alt text required`);
          }
        });
      }
      break;
    }
    case 'feature-cards': {
      parseJsonArray(cfg.cardsJson).forEach((card, i) => {
        if (card?.imageUrl && !card?.title) warnings.push(`Feature card ${i + 1}: image without title`);
        if (card?.linkUrl && !card?.title) warnings.push(`Feature card ${i + 1}: link without title text`);
      });
      break;
    }
    case 'logo-grid': {
      parseJsonArray(cfg.logosJson).forEach((logo, i) => {
        if (logo?.url && !String(logo.alt || '').trim() && !logo.decorative) {
          errors.push(`Logo ${i + 1}: alt text required (or mark decorative)`);
        }
      });
      break;
    }
    case 'newsletter': {
      if (!String(cfg.title || '').trim()) warnings.push('Newsletter: section title improves context');
      break;
    }
    default:
      break;
  }

  if (definition?.fields) {
    for (const field of definition.fields) {
      if (field.type === 'url' && cfg[field.key] && !/^https?:\/\//i.test(String(cfg[field.key]))) {
        warnings.push(`${definition.displayName}: ${field.label} may not be a valid URL`);
      }
    }
  }

  return { errors, warnings, pass: errors.length === 0 };
}

/**
 * @param {import('./blockSchema.js').PageBlock[]} blocks
 */
export function auditPageAccessibility(blocks) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];
  let passCount = 0;

  for (const block of blocks || []) {
    if (block.enabled === false) continue;
    const def = getBlockDefinition(block.type);
    const result = auditBlockAccessibility(block, def);
    const label = def?.displayName || block.type;
    result.errors.forEach((e) => errors.push(`${label} (#${(block.order ?? 0) + 1}): ${e}`));
    result.warnings.forEach((w) => warnings.push(`${label} (#${(block.order ?? 0) + 1}): ${w}`));
    if (result.pass) passCount += 1;
  }

  const enabled = (blocks || []).filter((b) => b.enabled !== false);
  const headingBlocks = enabled.filter((b) => ['hero', 'rich-text'].includes(b.type));
  if (headingBlocks.length > 1) {
    warnings.push('Multiple heading blocks — ensure single h1 on page (page shell provides sr-only h1)');
  }

  return {
    errors,
    warnings,
    pass: errors.length === 0,
    auditedBlocks: enabled.length,
    passCount,
  };
}

export const A11Y_REQUIRED_BLOCK_TYPES = [
  'hero', 'rich-text', 'cta', 'faq', 'gallery', 'feature-cards', 'logo-grid', 'newsletter',
];
