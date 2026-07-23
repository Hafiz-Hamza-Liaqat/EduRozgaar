/**
 * Config-driven search synonyms (C.7.0.4).
 */

/** @type {Record<string, string[]>} */
export const SEARCH_SYNONYM_GROUPS = {
  bscs: ['computer science', 'cs', 'bscs'],
  cs: ['computer science', 'cs', 'bscs'],
  'computer science': ['computer science', 'cs', 'bscs'],
  govt: ['government', 'govt', 'public sector'],
  government: ['government', 'govt', 'public sector'],
  scholarship: ['scholarship', 'funding', 'grant', 'financial aid'],
  funding: ['scholarship', 'funding', 'grant'],
  grant: ['scholarship', 'grant', 'funding'],
  admission: ['admission', 'admissions', 'enrollment', 'apply'],
  university: ['university', 'uni', 'college', 'institution'],
  remote: ['remote', 'work from home', 'wfh'],
  internship: ['internship', 'intern', 'trainee'],
};

/**
 * Expand query tokens with synonyms.
 * @param {string} query
 * @returns {string[]}
 */
export function expandSearchSynonyms(query) {
  const tokens = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  const expanded = new Set(tokens);
  for (const token of tokens) {
    const group = SEARCH_SYNONYM_GROUPS[token];
    if (group) group.forEach((w) => expanded.add(w));
  }
  return [...expanded];
}

/**
 * Build searchable text blob including synonyms.
 * @param {string[]} parts
 */
export function buildSearchTextBlob(parts = []) {
  const base = parts.filter(Boolean).join(' ').toLowerCase();
  const tokens = base.split(/\s+/).filter(Boolean);
  const extras = new Set();
  tokens.forEach((t) => {
    const group = SEARCH_SYNONYM_GROUPS[t];
    if (group) group.forEach((w) => extras.add(w));
  });
  return [base, ...extras].join(' ').trim();
}
