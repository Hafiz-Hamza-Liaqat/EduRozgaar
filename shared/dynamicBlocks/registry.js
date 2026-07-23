/**
 * Dynamic Content Blocks — source registry (C.7.0.3).
 */

/** @typedef {'grid'|'list'|'carousel'} DynamicLayoutStyle */
/** @typedef {'default'|'compact'|'featured'} DynamicCardStyle */

export const DYNAMIC_BLOCK_TYPES = [
  'featured-jobs',
  'featured-scholarships',
  'featured-admissions',
  'dynamic-universities',
  'dynamic-blogs',
  'dynamic-career',
  'dynamic-testimonials',
  'dynamic-partners',
];

export const DYNAMIC_BLOCK_TYPE_SET = new Set(DYNAMIC_BLOCK_TYPES);

/** Maps page-builder blockType → resolver source key */
export const BLOCK_TYPE_TO_SOURCE = {
  'featured-jobs': 'latest-jobs',
  'featured-scholarships': 'featured-scholarships',
  'featured-admissions': 'admissions',
  'dynamic-universities': 'universities',
  'dynamic-blogs': 'latest-blogs',
  'dynamic-career': 'career-guidance',
  'dynamic-testimonials': 'testimonials',
  'dynamic-partners': 'partners',
};

export const DYNAMIC_SOURCES = Object.values(BLOCK_TYPE_TO_SOURCE);

/**
 * @param {string} blockType
 */
export function resolveDynamicSource(blockType) {
  return BLOCK_TYPE_TO_SOURCE[blockType] || null;
}

/**
 * @param {string} blockType
 */
export function isDynamicBlockType(blockType) {
  return DYNAMIC_BLOCK_TYPE_SET.has(blockType);
}

/**
 * Default config per block type (additive; merged with block.config).
 * @param {string} blockType
 */
export function getDynamicBlockDefaults(blockType) {
  const base = {
    title: '',
    count: 6,
    sort: 'latest',
    layout: 'grid',
    cardStyle: 'default',
    showImage: true,
    showDescription: true,
    showMetadata: true,
    buttonText: 'View all',
    buttonLink: '',
    emptyMessage: 'No items to display right now.',
  };

  switch (blockType) {
    case 'featured-jobs':
      return {
        ...base,
        title: 'Latest Jobs',
        count: 8,
        featuredOnly: false,
        governmentOnly: false,
        province: '',
        category: '',
        remote: false,
        showLogo: true,
        showDeadline: true,
        buttonLink: '/jobs',
      };
    case 'featured-scholarships':
      return {
        ...base,
        title: 'Featured Scholarships',
        count: 6,
        country: '',
        degree: '',
        featured: true,
        deadlineFirst: true,
        buttonLink: '/scholarships',
      };
    case 'featured-admissions':
      return {
        ...base,
        title: 'Upcoming Admissions',
        count: 6,
        university: '',
        province: '',
        degree: '',
        upcomingOnly: true,
        sort: 'deadline',
        buttonLink: '/admissions',
      };
    case 'dynamic-universities':
      return {
        ...base,
        title: 'Universities',
        count: 6,
        featured: false,
        institutionType: '',
        province: '',
        ranking: false,
        buttonLink: '/universities',
      };
    case 'dynamic-blogs':
      return {
        ...base,
        title: 'Latest from the Blog',
        count: 6,
        category: '',
        featured: false,
        buttonLink: '/blog',
      };
    case 'dynamic-career':
      return {
        ...base,
        title: 'Career Guidance',
        count: 6,
        category: '',
        popular: false,
        buttonLink: '/career-guidance',
      };
    case 'dynamic-testimonials':
      return {
        ...base,
        title: 'What Students Say',
        count: 4,
        featured: true,
        random: false,
        showImage: true,
        showDescription: true,
        layout: 'list',
        cardStyle: 'compact',
      };
    case 'dynamic-partners':
      return {
        ...base,
        title: 'Our Partners',
        count: 12,
        logos: true,
        gridSize: 4,
        carousel: false,
        showDescription: false,
        showMetadata: false,
        layout: 'grid',
        cardStyle: 'compact',
      };
    default:
      return base;
  }
}

/**
 * Build API query params from block config.
 * @param {string} blockType
 * @param {Record<string, unknown>} config
 */
export function buildDynamicQuery(blockType, config = {}) {
  const merged = { ...getDynamicBlockDefaults(blockType), ...config };
  const count = Math.min(24, Math.max(1, Number(merged.count ?? merged.limit) || 6));

  const query = {
    count,
    sort: merged.sort || 'latest',
    locale: merged.locale || 'en',
  };

  switch (blockType) {
    case 'featured-jobs':
      if (merged.featuredOnly) query.featuredOnly = true;
      if (merged.governmentOnly) query.governmentOnly = true;
      if (merged.province) query.province = merged.province;
      if (merged.category) query.category = merged.category;
      if (merged.remote) query.remote = true;
      break;
    case 'featured-scholarships':
      if (merged.country) query.country = merged.country;
      if (merged.degree) query.degree = merged.degree;
      if (merged.featured) query.featured = true;
      if (merged.deadlineFirst) query.sort = 'deadline';
      break;
    case 'featured-admissions':
      if (merged.university) query.university = merged.university;
      if (merged.province) query.province = merged.province;
      if (merged.degree) query.degree = merged.degree;
      if (merged.upcomingOnly) query.upcomingOnly = true;
      break;
    case 'dynamic-universities':
      if (merged.featured) query.featured = true;
      if (merged.institutionType) query.type = merged.institutionType;
      if (merged.province) query.province = merged.province;
      if (merged.ranking) query.sort = 'ranking';
      break;
    case 'dynamic-blogs':
      if (merged.category) query.category = merged.category;
      if (merged.featured) query.featured = true;
      break;
    case 'dynamic-career':
      if (merged.category) query.category = merged.category;
      if (merged.popular) query.sort = 'popular';
      break;
    case 'dynamic-testimonials':
      if (merged.featured) query.featured = true;
      if (merged.random) query.random = true;
      break;
    case 'dynamic-partners':
      query.gridSize = Number(merged.gridSize) || 4;
      if (merged.random) query.random = true;
      break;
    default:
      break;
  }

  return query;
}

/**
 * @param {string} blockType
 * @param {Record<string, unknown>} config
 */
export function buildDisplayOptions(blockType, config = {}) {
  const merged = { ...getDynamicBlockDefaults(blockType), ...config };
  return {
    layout: merged.layout || 'grid',
    cardStyle: merged.cardStyle || 'default',
    showImage: merged.showImage !== false,
    showDescription: merged.showDescription !== false,
    showMetadata: merged.showMetadata !== false,
    showLogo: merged.showLogo !== false,
    showDeadline: merged.showDeadline !== false,
    buttonText: merged.buttonText || '',
    buttonLink: merged.buttonLink || '',
    emptyMessage: merged.emptyMessage || 'No items to display right now.',
    title: merged.title || '',
    gridSize: Number(merged.gridSize) || 4,
  };
}

/**
 * Stable cache key material for client/server.
 * @param {string} source
 * @param {object} query
 */
export function dynamicCacheKey(source, query = {}) {
  const normalized = Object.keys(query).sort().reduce((acc, k) => {
    acc[k] = query[k];
    return acc;
  }, {});
  return `dynamic:${source}:${JSON.stringify(normalized)}`;
}
