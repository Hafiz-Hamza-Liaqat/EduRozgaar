/**
 * Canonical search document shape (C.7.0.4).
 */
import { buildSearchTextBlob } from './synonyms.js';

/**
 * @typedef {Object} SearchDocumentShape
 * @property {string} id
 * @property {string} entityType
 * @property {string} entityId
 * @property {string} title
 * @property {string} slug
 * @property {string} url
 * @property {string} summary
 * @property {string[]} keywords
 * @property {string} category
 * @property {string} province
 * @property {string} country
 * @property {string[]} tags
 * @property {string|null} publishedAt
 * @property {string|null} updatedAt
 * @property {boolean} featured
 * @property {string} status
 * @property {boolean} searchable
 * @property {object} metadata
 * @property {string} locale
 * @property {string} searchText
 */

/**
 * @param {Partial<SearchDocumentShape>} input
 * @returns {SearchDocumentShape}
 */
export function normalizeSearchDocument(input) {
  const keywords = Array.isArray(input.keywords) ? input.keywords.filter(Boolean) : [];
  const tags = Array.isArray(input.tags) ? input.tags.filter(Boolean) : [];
  const searchText = input.searchText || buildSearchTextBlob([
    input.title,
    input.slug,
    input.summary,
    input.category,
    input.province,
    input.country,
    ...keywords,
    ...tags,
  ]);

  return {
    id: String(input.id || `${input.entityType}:${input.entityId}:${input.locale || 'en'}`),
    entityType: String(input.entityType || ''),
    entityId: String(input.entityId || ''),
    title: String(input.title || '').trim(),
    slug: String(input.slug || '').trim(),
    url: String(input.url || '').trim(),
    summary: String(input.summary || '').trim().slice(0, 500),
    keywords,
    category: String(input.category || '').trim(),
    province: String(input.province || '').trim(),
    country: String(input.country || '').trim(),
    tags,
    publishedAt: input.publishedAt || null,
    updatedAt: input.updatedAt || null,
    featured: Boolean(input.featured),
    status: String(input.status || 'active'),
    searchable: input.searchable !== false,
    metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
    locale: String(input.locale || 'en'),
    searchText,
  };
}

/**
 * @param {SearchDocumentShape} doc
 */
export function isPublicSearchable(doc) {
  if (!doc?.searchable) return false;
  const pub = new Set(['active', 'published']);
  return pub.has(doc.status);
}
