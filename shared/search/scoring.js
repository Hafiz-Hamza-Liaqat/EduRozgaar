/**
 * Client-safe search scoring (mirrors server logic).
 */
import { SEARCH_RANKING_WEIGHTS as W } from './rankingWeights.js';
import { expandSearchSynonyms } from './synonyms.js';

/**
 * @param {object} doc
 * @param {string} query
 */
export function scoreSearchDocument(doc, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q || !doc) return 0;

  const tokens = expandSearchSynonyms(q);
  const title = String(doc.title || '').toLowerCase();
  const slug = String(doc.slug || '').toLowerCase();
  const summary = String(doc.summary || '').toLowerCase();
  const searchText = String(doc.searchText || '').toLowerCase();
  const tags = (doc.tags || []).map((t) => String(t).toLowerCase());
  const keywords = (doc.keywords || []).map((k) => String(k).toLowerCase());

  let score = 0;

  if (title === q) score += W.exactTitle;
  else if (title.startsWith(q)) score += W.titlePrefix;
  else if (title.includes(q)) score += W.titleContains;

  if (slug && (slug === q || slug.includes(q))) score += W.slugMatch;
  if (doc.featured) score += W.featured;

  const haystack = `${searchText} ${summary} ${tags.join(' ')} ${keywords.join(' ')}`;
  for (const token of tokens) {
    if (!token) continue;
    if (keywords.some((k) => k.includes(token))) score += W.keywordMatch;
    if (tags.some((t) => t.includes(token))) score += W.tagMatch;
    if (summary.includes(token)) score += W.summaryMatch;
    if (String(doc.category || '').toLowerCase().includes(token)) score += W.categoryMatch;
    if (String(doc.province || '').toLowerCase().includes(token)) score += W.provinceMatch;
    if (String(doc.country || '').toLowerCase().includes(token)) score += W.countryMatch;
    if (haystack.includes(token) && !title.includes(token)) score += 5;
  }

  const ref = doc.publishedAt || doc.updatedAt;
  if (ref) {
    const ageDays = (Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24);
    const freshness = Math.max(0, W.freshnessMax * (1 - ageDays / W.freshnessDecayDays));
    score += freshness;
  }

  return score;
}

/**
 * @param {object[]} docs
 * @param {string} query
 * @param {string} sort
 */
export function rankSearchResults(docs, query, sort = 'relevance') {
  const scored = docs.map((doc) => ({
    ...doc,
    _score: scoreSearchDocument(doc, query),
  }));

  if (sort === 'newest') {
    scored.sort((a, b) => new Date(b.publishedAt || b.updatedAt || 0) - new Date(a.publishedAt || a.updatedAt || 0));
  } else if (sort === 'oldest') {
    scored.sort((a, b) => new Date(a.publishedAt || a.updatedAt || 0) - new Date(b.publishedAt || b.updatedAt || 0));
  } else if (sort === 'alphabetical') {
    scored.sort((a, b) => String(a.title).localeCompare(String(b.title)));
  } else {
    scored.sort((a, b) => b._score - a._score || String(a.title).localeCompare(String(b.title)));
  }

  return scored;
}
