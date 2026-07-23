/**
 * Placement & slot registry — concrete ad/content placement definitions.
 * slotId values match hardcoded frontend AdSense props (backward compatible).
 */
import { PLACEMENT_TYPE_TO_AD_SLOT } from './placementTypes.js';
import { getPageById } from './pageRegistry.js';

/**
 * @typedef {Object} PlacementDefinition
 * @property {string} id
 * @property {string} pageId
 * @property {string} displayName
 * @property {string} slotType
 * @property {string} slotId
 * @property {string} [slotIdPattern]
 * @property {string} componentHint
 * @property {number} maxSlots
 * @property {boolean} supportsAdsense
 * @property {boolean} supportsImageAds
 * @property {boolean} supportsHtmlAds
 * @property {boolean} supportsAffiliate
 * @property {number} [width]
 * @property {number} [height]
 * @property {string} visualArea
 * @property {string} description
 * @property {string} previewRoute
 * @property {boolean} [wiredInFrontend]
 * @property {boolean} [planned] - Intentionally unwired; no public layout yet
 */

/** @type {PlacementDefinition[]} */
export const PLACEMENT_REGISTRY = [
  // — Home (wired in Home.jsx) —
  {
    id: 'home-top',
    pageId: 'home',
    displayName: 'Home → Top Banner',
    slotType: 'header-banner',
    slotId: 'home-top',
    componentHint: 'AdBanner',
    maxSlots: 1,
    supportsAdsense: true,
    supportsImageAds: true,
    supportsHtmlAds: false,
    supportsAffiliate: true,
    width: 728,
    height: 90,
    visualArea: 'Top of page',
    description: 'Full-width banner immediately below the homepage hero section.',
    previewRoute: '/',
    wiredInFrontend: true,
  },
  {
    id: 'home-mid-1',
    pageId: 'home',
    displayName: 'Home → Mid In-Feed',
    slotType: 'inline',
    slotId: 'home-mid-1',
    slotIdPattern: 'home-mid-{index}',
    componentHint: 'AdHost',
    maxSlots: 3,
    supportsAdsense: true,
    supportsImageAds: true,
    supportsHtmlAds: false,
    supportsAffiliate: true,
    width: 728,
    height: 90,
    visualArea: 'Between sections',
    description: 'In-feed ad between homepage content sections (index 1 wired today).',
    previewRoute: '/',
    wiredInFrontend: true,
  },
  {
    id: 'home-sidebar',
    pageId: 'home',
    displayName: 'Home → Sidebar',
    slotType: 'sidebar',
    slotId: 'home-sidebar',
    componentHint: 'AdHost',
    maxSlots: 1,
    supportsAdsense: true,
    supportsImageAds: true,
    supportsHtmlAds: false,
    supportsAffiliate: true,
    width: 300,
    height: 600,
    visualArea: 'Sidebar',
    description: 'Right sidebar on homepage — planned when a sidebar layout is added.',
    previewRoute: '/',
    wiredInFrontend: false,
    planned: true,
  },
  {
    id: 'home-footer',
    pageId: 'home',
    displayName: 'Home → Footer Banner',
    slotType: 'footer',
    slotId: 'home-footer',
    componentHint: 'AdBanner',
    maxSlots: 1,
    supportsAdsense: true,
    supportsImageAds: true,
    supportsHtmlAds: false,
    supportsAffiliate: true,
    width: 728,
    height: 90,
    visualArea: 'Footer',
    description: 'Full-width banner at the bottom of homepage content, immediately above the site footer.',
    previewRoute: '/',
    wiredInFrontend: true,
  },
  {
    id: 'home-promo-strip',
    pageId: 'home',
    displayName: 'Home → CMS Promo Strip',
    slotType: 'promo-strip',
    slotId: 'home-cms-banner',
    componentHint: 'CmsBanner',
    maxSlots: 5,
    supportsAdsense: false,
    supportsImageAds: true,
    supportsHtmlAds: true,
    supportsAffiliate: true,
    visualArea: 'Above hero',
    description: 'CMS promotional banners rendered above the homepage hero.',
    previewRoute: '/',
    wiredInFrontend: true,
  },

  // — Jobs listing —
  {
    id: 'jobs-header',
    pageId: 'jobs-list',
    displayName: 'Jobs → Header Banner',
    slotType: 'header-banner',
    slotId: 'jobs-header',
    componentHint: 'AdBanner',
    maxSlots: 1,
    supportsAdsense: true,
    supportsImageAds: true,
    supportsHtmlAds: false,
    supportsAffiliate: true,
    width: 728,
    height: 90,
    visualArea: 'Top of listing',
    description: 'Banner at the top of the jobs listing page.',
    previewRoute: '/jobs',
    wiredInFrontend: true,
  },
  {
    id: 'jobs-sidebar',
    pageId: 'jobs-list',
    displayName: 'Jobs → Sidebar',
    slotType: 'sidebar',
    slotId: 'jobs-sidebar',
    componentHint: 'AdHost',
    maxSlots: 1,
    supportsAdsense: true,
    supportsImageAds: true,
    supportsHtmlAds: false,
    supportsAffiliate: true,
    width: 300,
    height: 600,
    visualArea: 'Sidebar',
    description: 'Right sidebar on the jobs listing page.',
    previewRoute: '/jobs',
    wiredInFrontend: true,
  },
  {
    id: 'jobs-infeed',
    pageId: 'jobs-list',
    displayName: 'Jobs → In-Feed',
    slotType: 'inline',
    slotId: 'jobs-infeed',
    slotIdPattern: 'jobs-infeed-{index}',
    componentHint: 'AdHost',
    maxSlots: 10,
    supportsAdsense: true,
    supportsImageAds: true,
    supportsHtmlAds: false,
    supportsAffiliate: true,
    width: 728,
    height: 90,
    visualArea: 'Between job cards',
    description: 'In-feed ads inserted every 5 job cards on the listing.',
    previewRoute: '/jobs',
    wiredInFrontend: true,
  },
  {
    id: 'jobs-footer',
    pageId: 'jobs-list',
    displayName: 'Jobs → Footer Banner',
    slotType: 'footer',
    slotId: 'jobs-footer',
    componentHint: 'AdBanner',
    maxSlots: 1,
    supportsAdsense: true,
    supportsImageAds: true,
    supportsHtmlAds: false,
    supportsAffiliate: true,
    width: 728,
    height: 90,
    visualArea: 'Footer',
    description: 'Banner above footer on jobs listing (future).',
    previewRoute: '/jobs',
    wiredInFrontend: true,
  },

  // — Scholarships —
  {
    id: 'scholarships-header',
    pageId: 'scholarships-list',
    displayName: 'Scholarships → Header Banner',
    slotType: 'header-banner',
    slotId: 'scholarships-header',
    componentHint: 'AdBanner',
    maxSlots: 1,
    supportsAdsense: true,
    supportsImageAds: true,
    supportsHtmlAds: false,
    supportsAffiliate: true,
    width: 728,
    height: 90,
    visualArea: 'Top of listing',
    description: 'Banner at the top of scholarships listing (future).',
    previewRoute: '/scholarships',
    wiredInFrontend: true,
  },
  {
    id: 'scholarships-sidebar',
    pageId: 'scholarships-list',
    displayName: 'Scholarships → Sidebar',
    slotType: 'sidebar',
    slotId: 'scholarships-sidebar',
    componentHint: 'AdHost',
    maxSlots: 1,
    supportsAdsense: true,
    supportsImageAds: true,
    supportsHtmlAds: false,
    supportsAffiliate: true,
    width: 300,
    height: 600,
    visualArea: 'Sidebar',
    description: 'Sidebar on scholarships listing.',
    previewRoute: '/scholarships',
    wiredInFrontend: true,
  },

  // — Blog —
  {
    id: 'blog-header',
    pageId: 'blog-list',
    displayName: 'Blog → Header Banner',
    slotType: 'header-banner',
    slotId: 'blog-header',
    componentHint: 'AdBanner',
    maxSlots: 1,
    supportsAdsense: true,
    supportsImageAds: true,
    supportsHtmlAds: false,
    supportsAffiliate: true,
    width: 728,
    height: 90,
    visualArea: 'Top of listing',
    description: 'Banner at the top of blog listing (future).',
    previewRoute: '/blog',
    wiredInFrontend: true,
  },
  {
    id: 'blog-sidebar',
    pageId: 'blog-list',
    displayName: 'Blog → Sidebar',
    slotType: 'sidebar',
    slotId: 'blog-sidebar',
    componentHint: 'AdHost',
    maxSlots: 1,
    supportsAdsense: true,
    supportsImageAds: true,
    supportsHtmlAds: false,
    supportsAffiliate: true,
    width: 300,
    height: 600,
    visualArea: 'Sidebar',
    description: 'Sidebar on blog listing.',
    previewRoute: '/blog',
    wiredInFrontend: true,
  },
  {
    id: 'blog-inline',
    pageId: 'blog-detail',
    displayName: 'Blog Post → Inline',
    slotType: 'inline',
    slotId: 'blog-inline-1',
    slotIdPattern: 'blog-inline-{index}',
    componentHint: 'AdHost',
    maxSlots: 3,
    supportsAdsense: true,
    supportsImageAds: true,
    supportsHtmlAds: false,
    supportsAffiliate: true,
    width: 728,
    height: 90,
    visualArea: 'Within article',
    description: 'Inline ad within blog post content, below featured image.',
    previewRoute: '/blog/prepare-university-admissions',
    wiredInFrontend: true,
  },

  // — Admissions —
  {
    id: 'admissions-header',
    pageId: 'admissions-list',
    displayName: 'Admissions → Header Banner',
    slotType: 'header-banner',
    slotId: 'admissions-header',
    componentHint: 'AdBanner',
    maxSlots: 1,
    supportsAdsense: true,
    supportsImageAds: true,
    supportsHtmlAds: false,
    supportsAffiliate: true,
    width: 728,
    height: 90,
    visualArea: 'Top of listing',
    description: 'Banner at the top of admissions listing.',
    previewRoute: '/admissions',
    wiredInFrontend: true,
  },
  {
    id: 'admissions-sidebar',
    pageId: 'admissions-list',
    displayName: 'Admissions → Sidebar',
    slotType: 'sidebar',
    slotId: 'admissions-sidebar',
    componentHint: 'AdHost',
    maxSlots: 1,
    supportsAdsense: true,
    supportsImageAds: true,
    supportsHtmlAds: false,
    supportsAffiliate: true,
    width: 300,
    height: 600,
    visualArea: 'Sidebar',
    description: 'Sidebar on admissions listing (future).',
    previewRoute: '/admissions',
    wiredInFrontend: true,
  },

  // — Career Guidance —
  {
    id: 'career-guidance-header',
    pageId: 'career-guidance-list',
    displayName: 'Career Guidance → Header Banner',
    slotType: 'header-banner',
    slotId: 'career-guidance-header',
    componentHint: 'AdBanner',
    maxSlots: 1,
    supportsAdsense: true,
    supportsImageAds: true,
    supportsHtmlAds: false,
    supportsAffiliate: true,
    width: 728,
    height: 90,
    visualArea: 'Top of page',
    description: 'Banner at the top of career guidance hub.',
    previewRoute: '/career-guidance',
    wiredInFrontend: true,
  },

  // — Homepage CMS sections (not ad slots) —
  {
    id: 'home-section-featured-jobs',
    pageId: 'home',
    displayName: 'Home → Featured Jobs Section',
    slotType: 'cms-section',
    slotId: 'home-section-featured-jobs',
    componentHint: 'HomeSection',
    maxSlots: 1,
    supportsAdsense: false,
    supportsImageAds: false,
    supportsHtmlAds: false,
    supportsAffiliate: false,
    visualArea: 'Main content',
    description: 'Featured jobs carousel section on homepage (CMS content, not an ad slot).',
    previewRoute: '/',
    wiredInFrontend: false,
    planned: false,
  },
  {
    id: 'home-section-featured-scholarships',
    pageId: 'home',
    displayName: 'Home → Featured Scholarships Section',
    slotType: 'cms-section',
    slotId: 'home-section-featured-scholarships',
    componentHint: 'HomeSection',
    maxSlots: 1,
    supportsAdsense: false,
    supportsImageAds: false,
    supportsHtmlAds: false,
    supportsAffiliate: false,
    visualArea: 'Main content',
    description: 'Featured scholarships section on homepage (CMS content, not an ad slot).',
    previewRoute: '/',
    wiredInFrontend: false,
    planned: false,
  },
];

const placementById = new Map(PLACEMENT_REGISTRY.map((p) => [p.id, p]));
const placementBySlotId = new Map(PLACEMENT_REGISTRY.map((p) => [p.slotId, p]));

export function getPlacementById(placementId) {
  return placementById.get(placementId) ?? null;
}

export function getPlacementBySlotId(slotId) {
  if (!slotId) return null;
  const exact = placementBySlotId.get(slotId);
  if (exact) return exact;
  return PLACEMENT_REGISTRY.find((p) => {
    if (p.slotIdPattern && slotId.startsWith(p.slotId.replace(/-\d+$/, '').replace(/-0$/, ''))) return true;
    const base = p.slotId.replace(/-\d+$/, '');
    return base && slotId.startsWith(`${base}-`);
  }) ?? null;
}

export function getPlacementsForPage(pageId, slotType = null) {
  return PLACEMENT_REGISTRY.filter((p) => {
    if (p.pageId !== pageId) return false;
    if (slotType && p.slotType !== slotType) return false;
    return true;
  });
}

export function getAdPlacementsForPage(pageId, slotType = null) {
  return getPlacementsForPage(pageId, slotType).filter(
    (p) => p.supportsAdsense || p.supportsImageAds
  );
}

/** Ad placements wired in public pages — admin may only assign these. */
export function getSelectableAdPlacementsForPage(pageId, slotType = null) {
  return getPlacementsForPage(pageId, slotType).filter(
    (p) =>
      p.wiredInFrontend
      && (p.supportsAdsense || p.supportsImageAds)
      && p.slotType !== 'cms-section'
      && p.componentHint !== 'CmsBanner'
  );
}

/** CMS promo banner placements for Site CMS admin picker. */
export function getCmsBannerPlacements() {
  return PLACEMENT_REGISTRY.filter((p) => p.componentHint === 'CmsBanner').map((p) => ({
    ...p,
    /** Stored CmsBanner.placement value (legacy default: homepage). */
    bannerPlacement: p.slotId === 'home-cms-banner' ? 'homepage' : p.slotId,
  }));
}

export function getPlacementTypesForPage(pageId) {
  const types = new Set(
    getSelectableAdPlacementsForPage(pageId).map((p) => p.slotType)
  );
  return [...types];
}

export function resolveAdSlotPlacementEnum(slotType) {
  return PLACEMENT_TYPE_TO_AD_SLOT[slotType] ?? 'sidebar';
}

export function getWiredPlacements() {
  return PLACEMENT_REGISTRY.filter((p) => p.wiredInFrontend);
}

export function getPlannedAdPlacements() {
  return PLACEMENT_REGISTRY.filter((p) => p.planned && (p.supportsAdsense || p.supportsImageAds));
}

export function resolveSlotFromPlacement(placementId) {
  const placement = getPlacementById(placementId);
  if (!placement) return null;
  return {
    slotId: placement.slotId,
    placement: resolveAdSlotPlacementEnum(placement.slotType),
    pageId: placement.pageId,
    displayName: placement.displayName,
    previewRoute: placement.previewRoute,
  };
}

export function resolvePlacementFromSlotId(slotId) {
  const placement = getPlacementBySlotId(slotId);
  if (!placement) return null;
  return {
    pageId: placement.pageId,
    placementId: placement.id,
    slotType: placement.slotType,
    displayName: placement.displayName,
    previewRoute: placement.previewRoute,
    adPlacement: resolveAdSlotPlacementEnum(placement.slotType),
  };
}
