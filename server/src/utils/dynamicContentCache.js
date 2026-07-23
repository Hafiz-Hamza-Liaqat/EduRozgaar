/**
 * Cache invalidation hooks for dynamic content blocks (C.7.0.3).
 * Call from admin write paths when listing data changes.
 */
import { invalidateDynamicSourceCache } from '../services/dynamicContent/memoryCache.js';

/**
 * @param {string[]} sources
 */
export function invalidateDynamicContentSources(sources = []) {
  for (const source of sources) {
    if (source) invalidateDynamicSourceCache(source);
  }
}

export const DYNAMIC_SOURCE_BY_ENTITY = {
  job: ['latest-jobs'],
  scholarship: ['featured-scholarships'],
  admission: ['admissions'],
  university: ['universities'],
  blog: ['latest-blogs'],
  career: ['career-guidance'],
  homepage: ['testimonials', 'partners'],
};

/**
 * @param {keyof typeof DYNAMIC_SOURCE_BY_ENTITY} entity
 */
export function invalidateDynamicContentForEntity(entity) {
  invalidateDynamicContentSources(DYNAMIC_SOURCE_BY_ENTITY[entity] || []);
}
