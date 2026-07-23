/** Canonical Pakistan province labels for UI + seed/SEO alignment. */
export const PAKISTAN_PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad',
  'Gilgit-Baltistan',
  'AJK',
  'Other',
];

/** Short UI aliases that map to canonical labels. */
export const PROVINCE_ALIASES = {
  KPK: 'Khyber Pakhtunkhwa',
  KP: 'Khyber Pakhtunkhwa',
  'Khyber Pakhtunkhwa': 'Khyber Pakhtunkhwa',
  ICT: 'Islamabad',
  GB: 'Gilgit-Baltistan',
  AJK: 'AJK',
};

export function normalizeProvinceLabel(value) {
  if (!value || typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (PROVINCE_ALIASES[trimmed]) return PROVINCE_ALIASES[trimmed];
  const lower = trimmed.toLowerCase();
  const hit = PAKISTAN_PROVINCES.find((p) => p.toLowerCase() === lower);
  return hit || trimmed;
}
