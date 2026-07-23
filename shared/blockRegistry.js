/**
 * Page Builder — block registry (C.6.4.8).
 * Shared metadata; React renderers live in client blockComponentMap.
 */
import { getDefaultConfig, createBlock, parseJsonArray } from './blockSchema.js';

/**
 * @typedef {Object} BlockDefinition
 * @property {string} blockType
 * @property {string} displayName
 * @property {string} icon
 * @property {string} category
 * @property {import('./blockSchema.js').BlockFieldDefinition[]} fields
 * @property {string} rendererKey
 * @property {boolean} supportsPreview
 * @property {(config: Record<string, unknown>) => string[]|string|void} [validate]
 * @property {(config: Record<string, unknown>) => string[]|string|void} [getWarnings]
 */

/** @type {BlockDefinition[]} */
export const BLOCK_REGISTRY = [
  {
    blockType: 'hero',
    displayName: 'Hero',
    icon: 'hero',
    category: 'content',
    rendererKey: 'HeroBlock',
    supportsPreview: true,
    fields: [
      { key: 'headline', label: 'Title', type: 'text', required: true },
      { key: 'subheadline', label: 'Subtitle', type: 'textarea' },
      { key: 'backgroundImageUrl', label: 'Background image URL', type: 'url' },
      { key: 'overlayOpacity', label: 'Overlay opacity (0–100)', type: 'range', min: 0, max: 100, defaultValue: 45 },
      { key: 'primaryCtaLabel', label: 'Primary CTA label', type: 'text' },
      { key: 'primaryCtaUrl', label: 'Primary CTA URL', type: 'url' },
      { key: 'secondaryCtaLabel', label: 'Secondary CTA label', type: 'text' },
      { key: 'secondaryCtaUrl', label: 'Secondary CTA URL', type: 'url' },
      {
        key: 'alignment',
        label: 'Alignment',
        type: 'select',
        options: [
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ],
        defaultValue: 'center',
      },
      {
        key: 'height',
        label: 'Height',
        type: 'select',
        options: [
          { value: 'sm', label: 'Small' },
          { value: 'md', label: 'Medium' },
          { value: 'lg', label: 'Large' },
          { value: 'xl', label: 'Extra large' },
        ],
        defaultValue: 'lg',
      },
    ],
    getWarnings(config) {
      const warnings = [];
      if (config.primaryCtaLabel && !config.primaryCtaUrl) warnings.push('Primary CTA label is set but URL is missing');
      if (config.secondaryCtaLabel && !config.secondaryCtaUrl) warnings.push('Secondary CTA label is set but URL is missing');
      if (config.backgroundImageUrl && !String(config.backgroundImageUrl).startsWith('http')) {
        warnings.push('Background image URL may be invalid');
      }
      return warnings;
    },
  },
  {
    blockType: 'rich-text',
    displayName: 'Rich Text',
    icon: 'text',
    category: 'content',
    rendererKey: 'RichTextBlock',
    supportsPreview: true,
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'htmlContent', label: 'Content', type: 'richtext' },
      { key: 'body', label: 'Legacy plain text (fallback)', type: 'textarea' },
    ],
    validate(config) {
      const html = String(config.htmlContent || '').replace(/<[^>]+>/g, '').trim();
      const body = String(config.body || '').trim();
      if (!html && !body) return ['Content is required'];
      return [];
    },
  },
  {
    blockType: 'cta',
    displayName: 'CTA',
    icon: 'cta',
    category: 'content',
    rendererKey: 'CtaBlock',
    supportsPreview: true,
    fields: [
      { key: 'title', label: 'Heading', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'buttonLabel', label: 'Button text', type: 'text', required: true },
      { key: 'buttonUrl', label: 'Button URL', type: 'url', required: true },
      {
        key: 'buttonStyle',
        label: 'Button style',
        type: 'select',
        options: [
          { value: 'primary', label: 'Primary' },
          { value: 'secondary', label: 'Secondary' },
          { value: 'outline', label: 'Outline' },
        ],
        defaultValue: 'primary',
      },
      { key: 'icon', label: 'Icon (emoji or short text)', type: 'text', placeholder: '→' },
      { key: 'backgroundColor', label: 'Background color', type: 'color', placeholder: '#f0f9ff' },
      { key: 'backgroundImageUrl', label: 'Background image URL', type: 'url' },
    ],
  },
  {
    blockType: 'faq',
    displayName: 'FAQ',
    icon: 'faq',
    category: 'content',
    rendererKey: 'FaqBlock',
    supportsPreview: true,
    fields: [
      { key: 'title', label: 'Section title', type: 'text', defaultValue: 'FAQ' },
      { key: 'itemsJson', label: 'Questions & answers', type: 'textarea', defaultValue: '[]' },
    ],
    validate(config) {
      const items = parseJsonArray(config.itemsJson);
      if (!items.length) return ['Add at least one FAQ item'];
      /** @type {string[]} */
      const errors = [];
      items.forEach((item, i) => {
        const q = String(item?.question || '').trim();
        const a = String(item?.answer || '').trim();
        if (!q) errors.push(`FAQ item ${i + 1}: question is required`);
        if (!a) errors.push(`FAQ item ${i + 1}: answer is required`);
      });
      return errors;
    },
    getWarnings(config) {
      const items = parseJsonArray(config.itemsJson);
      if (items.length < 2) return ['FAQ sections with only one item may look sparse'];
      return [];
    },
  },
  {
    blockType: 'gallery',
    displayName: 'Image / Gallery',
    icon: 'gallery',
    category: 'media',
    rendererKey: 'GalleryBlock',
    supportsPreview: true,
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      {
        key: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'single', label: 'Single image' },
          { value: 'gallery', label: 'Gallery' },
        ],
        defaultValue: 'gallery',
      },
      { key: 'imageUrl', label: 'Image URL (single mode)', type: 'url' },
      { key: 'altText', label: 'Alt text (single mode)', type: 'text' },
      { key: 'caption', label: 'Caption (single mode)', type: 'text' },
      { key: 'imagesJson', label: 'Gallery images', type: 'textarea', defaultValue: '[]' },
      {
        key: 'layout',
        label: 'Layout',
        type: 'select',
        options: [
          { value: 'grid-2', label: '2 columns' },
          { value: 'grid-3', label: '3 columns' },
          { value: 'grid-4', label: '4 columns' },
        ],
        defaultValue: 'grid-3',
      },
      { key: 'lazyLoad', label: 'Lazy load images', type: 'boolean', defaultValue: true },
    ],
    validate(config) {
      const mode = config.mode || 'gallery';
      if (mode === 'single') {
        if (!String(config.imageUrl || '').trim()) return ['Image URL is required in single mode'];
        if (!String(config.altText || '').trim()) return ['Alt text is required in single mode'];
        return [];
      }
      const images = parseJsonArray(config.imagesJson);
      if (!images.length) return ['Add at least one gallery image'];
      /** @type {string[]} */
      const errors = [];
      images.forEach((img, i) => {
        if (!String(img?.url || '').trim()) errors.push(`Gallery image ${i + 1}: URL is required`);
        if (!String(img?.alt || '').trim()) errors.push(`Gallery image ${i + 1}: alt text is required`);
      });
      return errors;
    },
  },
  {
    blockType: 'feature-cards',
    displayName: 'Feature Cards',
    icon: 'cards',
    category: 'content',
    rendererKey: 'FeatureCardsBlock',
    supportsPreview: true,
    fields: [
      { key: 'title', label: 'Section title', type: 'text' },
      { key: 'cardsJson', label: 'Cards', type: 'textarea', defaultValue: '[]' },
      {
        key: 'columns',
        label: 'Grid columns',
        type: 'select',
        options: [
          { value: '2', label: '2 columns' },
          { value: '3', label: '3 columns' },
          { value: '4', label: '4 columns' },
        ],
        defaultValue: '3',
      },
      {
        key: 'hoverStyle',
        label: 'Hover style',
        type: 'select',
        options: [
          { value: 'lift', label: 'Lift' },
          { value: 'border', label: 'Border highlight' },
          { value: 'none', label: 'None' },
        ],
        defaultValue: 'lift',
      },
    ],
    validate(config) {
      const cards = parseJsonArray(config.cardsJson);
      if (!cards.length) return ['Add at least one feature card'];
      /** @type {string[]} */
      const errors = [];
      cards.forEach((card, i) => {
        if (!String(card?.title || '').trim()) errors.push(`Card ${i + 1}: title is required`);
      });
      return errors;
    },
    getWarnings(config) {
      const cards = parseJsonArray(config.cardsJson);
      const warnings = cards
        .map((card, i) => (!String(card?.description || '').trim() ? `Card ${i + 1}: missing description` : null))
        .filter(Boolean);
      return warnings;
    },
  },
  {
    blockType: 'logo-grid',
    displayName: 'Logo Grid',
    icon: 'grid',
    category: 'media',
    rendererKey: 'LogoGridBlock',
    supportsPreview: true,
    fields: [
      { key: 'title', label: 'Section title', type: 'text' },
      { key: 'logosJson', label: 'Logos (JSON array of {url, alt, linkUrl})', type: 'textarea', defaultValue: '[]' },
      { key: 'grayscale', label: 'Grayscale logos until hover', type: 'boolean', defaultValue: false },
    ],
    validate(config) {
      const logos = parseJsonArray(config.logosJson);
      if (!logos.length) return ['Add at least one logo'];
      /** @type {string[]} */
      const errors = [];
      logos.forEach((logo, i) => {
        if (!String(logo?.url || '').trim()) errors.push(`Logo ${i + 1}: URL is required`);
        if (!String(logo?.alt || '').trim() && !logo?.decorative) {
          errors.push(`Logo ${i + 1}: alt text is required (or mark decorative)`);
        }
      });
      return errors;
    },
  },
  {
    blockType: 'ad-placement',
    displayName: 'Advertisement Placement',
    icon: 'ad',
    category: 'ads',
    rendererKey: 'AdPlacementBlock',
    supportsPreview: true,
    fields: [
      { key: 'placementId', label: 'Placement ID', type: 'placementId', required: true, placeholder: 'blog-header' },
      {
        key: 'variant',
        label: 'Variant',
        type: 'select',
        options: [
          { value: 'banner', label: 'Banner' },
          { value: 'sidebar', label: 'Sidebar' },
          { value: 'inline', label: 'Inline' },
        ],
        defaultValue: 'banner',
      },
    ],
  },
  {
    blockType: 'featured-jobs',
    displayName: 'Latest Jobs',
    icon: 'jobs',
    category: 'listings',
    rendererKey: 'FeaturedJobsBlock',
    supportsPreview: true,
    fields: [],
  },
  {
    blockType: 'featured-scholarships',
    displayName: 'Featured Scholarships',
    icon: 'scholarships',
    category: 'listings',
    rendererKey: 'FeaturedScholarshipsBlock',
    supportsPreview: true,
    fields: [],
  },
  {
    blockType: 'featured-admissions',
    displayName: 'Admissions',
    icon: 'admissions',
    category: 'listings',
    rendererKey: 'FeaturedAdmissionsBlock',
    supportsPreview: true,
    fields: [],
  },
  {
    blockType: 'dynamic-universities',
    displayName: 'Universities',
    icon: 'globe',
    category: 'listings',
    rendererKey: 'DynamicUniversitiesBlock',
    supportsPreview: true,
    fields: [],
  },
  {
    blockType: 'dynamic-blogs',
    displayName: 'Latest Blogs',
    icon: 'text',
    category: 'listings',
    rendererKey: 'DynamicBlogsBlock',
    supportsPreview: true,
    fields: [],
  },
  {
    blockType: 'dynamic-career',
    displayName: 'Career Guidance',
    icon: 'resources',
    category: 'listings',
    rendererKey: 'DynamicCareerBlock',
    supportsPreview: true,
    fields: [],
  },
  {
    blockType: 'dynamic-testimonials',
    displayName: 'Testimonials',
    icon: 'text',
    category: 'content',
    rendererKey: 'DynamicTestimonialsBlock',
    supportsPreview: true,
    fields: [],
  },
  {
    blockType: 'dynamic-partners',
    displayName: 'Partners',
    icon: 'grid',
    category: 'content',
    rendererKey: 'DynamicPartnersBlock',
    supportsPreview: true,
    fields: [],
  },
  {
    blockType: 'newsletter',
    displayName: 'Newsletter',
    icon: 'newsletter',
    category: 'forms',
    rendererKey: 'NewsletterBlock',
    supportsPreview: true,
    fields: [
      { key: 'title', label: 'Title', type: 'text', defaultValue: 'Stay updated' },
      { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
    ],
  },
  {
    blockType: 'form',
    displayName: 'Form',
    icon: 'form',
    category: 'forms',
    rendererKey: 'FormBlock',
    supportsPreview: true,
    fields: [
      { key: 'formId', label: 'Form', type: 'text', required: true },
      { key: 'title', label: 'Title override', type: 'text' },
      { key: 'subtitle', label: 'Subtitle override', type: 'textarea' },
    ],
    validate(config) {
      if (!String(config.formId || '').trim()) return ['Form selection is required'];
      return [];
    },
  },
  {
    blockType: 'student-resources',
    displayName: 'Student Resources',
    icon: 'resources',
    category: 'listings',
    rendererKey: 'StudentResourcesBlock',
    supportsPreview: true,
    fields: [
      { key: 'title', label: 'Title', type: 'text', defaultValue: 'Student Resources' },
      { key: 'itemsJson', label: 'Items (JSON array of {label, path, icon})', type: 'textarea', defaultValue: '[]' },
    ],
  },
  {
    blockType: 'foreign-study-countries',
    displayName: 'Foreign Study Countries',
    icon: 'globe',
    category: 'listings',
    rendererKey: 'ForeignStudyCountriesBlock',
    supportsPreview: true,
    fields: [
      { key: 'title', label: 'Title', type: 'text', defaultValue: 'Foreign Study Opportunities' },
      { key: 'itemsJson', label: 'Items (JSON array of {name, path, query})', type: 'textarea', defaultValue: '[]' },
    ],
  },
  {
    blockType: 'spacer',
    displayName: 'Spacer',
    icon: 'spacer',
    category: 'layout',
    rendererKey: 'SpacerBlock',
    supportsPreview: true,
    fields: [
      { key: 'height', label: 'Height (px)', type: 'number', min: 8, max: 240, defaultValue: 32 },
    ],
  },
  {
    blockType: 'divider',
    displayName: 'Divider',
    icon: 'divider',
    category: 'layout',
    rendererKey: 'DividerBlock',
    supportsPreview: true,
    fields: [
      {
        key: 'style',
        label: 'Style',
        type: 'select',
        options: [
          { value: 'solid', label: 'Solid' },
          { value: 'dashed', label: 'Dashed' },
        ],
        defaultValue: 'solid',
      },
    ],
  },
];

const byType = new Map(BLOCK_REGISTRY.map((b) => [b.blockType, b]));
const byRenderer = new Map(BLOCK_REGISTRY.map((b) => [b.rendererKey, b]));

export function getBlockDefinition(blockType) {
  return byType.get(blockType) ?? null;
}

export function getBlockByRendererKey(rendererKey) {
  return byRenderer.get(rendererKey) ?? null;
}

export function getAllBlockDefinitions() {
  return [...BLOCK_REGISTRY];
}

export function getBlockDefinitionsByCategory(category) {
  return BLOCK_REGISTRY.filter((b) => b.category === category);
}

export function getBlockDefinitionMap() {
  return byType;
}

export function createDefaultBlock(blockType) {
  const def = getBlockDefinition(blockType);
  if (!def) return null;
  return createBlock(blockType, getDefaultConfig(def));
}

export const BLOCK_CATEGORIES = [...new Set(BLOCK_REGISTRY.map((b) => b.category))].sort();

export const REQUIRED_BLOCK_TYPES = BLOCK_REGISTRY.map((b) => b.blockType);
