/**
 * Centralized search ranking weights (C.7.0.4).
 * No magic numbers scattered in services.
 */

export const SEARCH_RANKING_WEIGHTS = {
  exactTitle: 100,
  titlePrefix: 60,
  titleContains: 40,
  slugMatch: 35,
  featured: 25,
  keywordMatch: 20,
  summaryMatch: 15,
  tagMatch: 18,
  categoryMatch: 12,
  provinceMatch: 10,
  countryMatch: 10,
  freshnessMax: 15,
  freshnessDecayDays: 90,
};

export const SEARCH_DEBOUNCE_MS = 200;
export const SEARCH_DEFAULT_LIMIT = 20;
export const SEARCH_MAX_LIMIT = 50;
export const SEARCH_SUGGESTION_LIMIT = 5;
export const SEARCH_DEFAULT_TTL_MS = 60_000;
