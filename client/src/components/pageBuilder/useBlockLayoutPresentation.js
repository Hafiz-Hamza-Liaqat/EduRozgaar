import { useMemo } from 'react';
import {
  ANIMATION_ENTER_CLASSES,
  CONTAINER_WIDTH_CLASSES,
  STYLE_PRESET_CLASSES,
  TYPOGRAPHY_ALIGN_CLASSES,
  TYPOGRAPHY_BODY_CLASSES,
  TYPOGRAPHY_HEADING_CLASSES,
  TYPOGRAPHY_MAX_WIDTH_CLASSES,
  TYPOGRAPHY_WEIGHT_CLASSES,
} from '@shared/designTokens.js';
import {
  getBlockLayoutSettings,
  resolveSpacingStyle,
  resolveVisibilityClasses,
} from '@shared/pageBuilderLayout.js';

/**
 * Memoizable layout presentation resolver (C.6.4.14).
 * @param {import('@shared/blockSchema.js').PageBlock} block
 */
export function resolveBlockLayoutPresentation(block) {
  const layout = getBlockLayoutSettings(block);
  const spacingStyle = resolveSpacingStyle(layout);
  const visibilityClass = resolveVisibilityClasses(layout.visibility);
  const containerClass = CONTAINER_WIDTH_CLASSES[layout.containerWidth] || CONTAINER_WIDTH_CLASSES.contained;
  const preset = STYLE_PRESET_CLASSES[layout.stylePreset] || STYLE_PRESET_CLASSES.default;

  const typography = layout.typography || {};
  const typographyClass = [
    TYPOGRAPHY_HEADING_CLASSES[typography.headingSize],
    TYPOGRAPHY_BODY_CLASSES[typography.bodySize],
    TYPOGRAPHY_ALIGN_CLASSES[typography.alignment],
    TYPOGRAPHY_WEIGHT_CLASSES[typography.weight],
    TYPOGRAPHY_MAX_WIDTH_CLASSES[typography.maxTextWidth],
    preset.text,
  ].filter(Boolean).join(' ');

  const bg = layout.background || {};
  /** @type {import('react').CSSProperties} */
  const backgroundStyle = {};
  if (bg.type === 'solid' && bg.color) {
    backgroundStyle.backgroundColor = bg.color;
  } else if (bg.type === 'gradient' && bg.gradientFrom && bg.gradientTo) {
    const angle = Number(bg.gradientAngle) || 135;
    backgroundStyle.backgroundImage = `linear-gradient(${angle}deg, ${bg.gradientFrom}, ${bg.gradientTo})`;
  } else if (bg.type === 'image' && bg.imageUrl) {
    const opacity = Math.min(100, Math.max(0, Number(bg.overlayOpacity) || 0)) / 100;
    backgroundStyle.backgroundImage = `linear-gradient(rgba(15,23,42,${opacity}), rgba(15,23,42,${opacity})), url(${bg.imageUrl})`;
    backgroundStyle.backgroundSize = 'cover';
    backgroundStyle.backgroundPosition = 'center';
    if (bg.parallax) backgroundStyle.backgroundAttachment = 'fixed';
  }

  const animationClass = ANIMATION_ENTER_CLASSES[layout.animation] || '';

  return {
    layout,
    visibilityClass,
    containerClass,
    presetClass: preset.surface,
    typographyClass,
    spacingStyle,
    backgroundStyle,
    animationClass,
    animation: layout.animation,
  };
}

/**
 * @param {import('@shared/blockSchema.js').PageBlock} block
 */
export function useBlockLayoutPresentation(block) {
  return useMemo(
    () => resolveBlockLayoutPresentation(block),
    [
      block?.id,
      block?.metadata?.layout,
    ],
  );
}
