/** Logical placement types used on pages (metadata-driven, not ad-specific). */
export const PLACEMENT_TYPES = [
  'hero',
  'header-banner',
  'sidebar',
  'inline',
  'footer',
  'between-sections',
  'promo-strip',
  'cms-section',
];

/** Maps logical placement type → AdSlotConfig.placement enum (backward compatible). */
export const PLACEMENT_TYPE_TO_AD_SLOT = {
  hero: 'banner_top',
  'header-banner': 'header',
  sidebar: 'sidebar',
  inline: 'in_feed',
  footer: 'banner_bottom',
  'between-sections': 'in_feed',
  'promo-strip': 'banner_top',
  'cms-section': 'banner_top',
};

export const AD_SLOT_TO_PLACEMENT_TYPE = Object.fromEntries(
  Object.entries(PLACEMENT_TYPE_TO_AD_SLOT).map(([k, v]) => [v, k])
);

export const PLACEMENT_TYPE_LABELS = {
  hero: 'Hero',
  'header-banner': 'Header Banner',
  sidebar: 'Sidebar',
  inline: 'Inline / In-Feed',
  footer: 'Footer',
  'between-sections': 'Between Sections',
  'promo-strip': 'Promo Strip',
  'cms-section': 'CMS Section',
};
