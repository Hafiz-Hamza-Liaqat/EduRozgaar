/**
 * React renderer map for page-builder blocks (C.6.4.8).
 * Keys must match BlockDefinition.rendererKey in @shared/blockRegistry.js
 */
import {
  HeroBlock,
  RichTextBlock,
  CtaBlock,
  FaqBlock,
  GalleryBlock,
  AdPlacementBlock,
  FeaturedJobsBlock,
  FeaturedScholarshipsBlock,
  FeaturedAdmissionsBlock,
  DynamicUniversitiesBlock,
  DynamicBlogsBlock,
  DynamicCareerBlock,
  DynamicTestimonialsBlock,
  DynamicPartnersBlock,
  NewsletterBlock,
  StudentResourcesBlock,
  ForeignStudyCountriesBlock,
  SpacerBlock,
  DividerBlock,
  FeatureCardsBlock,
  LogoGridBlock,
  FormBlock,
} from './blocks';

/** @type {Record<string, import('react').ComponentType<{ block: import('@shared/blockSchema.js').PageBlock; preview?: boolean }>>} */
export const BLOCK_COMPONENT_MAP = {
  HeroBlock,
  RichTextBlock,
  CtaBlock,
  FaqBlock,
  GalleryBlock,
  AdPlacementBlock,
  FeaturedJobsBlock,
  FeaturedScholarshipsBlock,
  FeaturedAdmissionsBlock,
  DynamicUniversitiesBlock,
  DynamicBlogsBlock,
  DynamicCareerBlock,
  DynamicTestimonialsBlock,
  DynamicPartnersBlock,
  NewsletterBlock,
  FormBlock,
  StudentResourcesBlock,
  ForeignStudyCountriesBlock,
  SpacerBlock,
  DividerBlock,
  FeatureCardsBlock,
  LogoGridBlock,
};

export function getBlockComponent(rendererKey) {
  return BLOCK_COMPONENT_MAP[rendererKey] ?? null;
}

export const BLOCK_RENDERER_KEYS = Object.keys(BLOCK_COMPONENT_MAP);
