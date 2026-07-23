/**
 * Page Builder per-block layout settings (C.6.4.14).
 * Stored in block.metadata.layout — additive, backward compatible.
 */
import {
  ANIMATION_PRESET_KEYS,
  CONTAINER_WIDTH_KEYS,
  GRID_BLOCK_TYPES,
  GRID_COLUMN_OPTIONS,
  SPACING_PRESET_KEYS,
  SPACING_PRESETS,
  STYLE_PRESET_KEYS,
  THEME_COLOR_TOKENS,
  TYPOGRAPHY_ALIGN_KEYS,
  TYPOGRAPHY_BODY_SIZE_KEYS,
  TYPOGRAPHY_HEADING_SIZE_KEYS,
  TYPOGRAPHY_MAX_WIDTH_KEYS,
  TYPOGRAPHY_WEIGHT_KEYS,
} from './designTokens.js';

/** @typedef {import('./blockSchema.js').PageBlock} PageBlock */

/**
 * @typedef {Object} BlockLayoutSettings
 * @property {{ desktop: boolean; tablet: boolean; mobile: boolean }} visibility
 * @property {string} containerWidth
 * @property {{ paddingTop: string; paddingBottom: string; marginTop: string; marginBottom: string }} spacing
 * @property {Object} background
 * @property {Object} typography
 * @property {{ desktop: number; tablet: number; mobile: number }} grid
 * @property {string} animation
 * @property {string} stylePreset
 */

export function defaultBlockLayoutSettings() {
  return {
    visibility: { desktop: true, tablet: true, mobile: true },
    containerWidth: 'contained',
    spacing: {
      paddingTop: 'm',
      paddingBottom: 'm',
      marginTop: 'none',
      marginBottom: 'none',
    },
    background: {
      type: 'none',
      color: '',
      gradientFrom: '',
      gradientTo: '',
      gradientAngle: 135,
      imageUrl: '',
      overlayOpacity: 0,
      parallax: false,
    },
    typography: {
      headingSize: 'default',
      bodySize: 'default',
      alignment: 'default',
      weight: 'default',
      maxTextWidth: 'default',
    },
    grid: {
      desktop: 3,
      tablet: 2,
      mobile: 1,
    },
    animation: 'none',
    stylePreset: 'default',
  };
}

/**
 * @param {unknown} raw
 * @returns {BlockLayoutSettings}
 */
export function normalizeBlockLayoutSettings(raw) {
  const base = defaultBlockLayoutSettings();
  if (!raw || typeof raw !== 'object') return base;
  const src = /** @type {Record<string, unknown>} */ (raw);

  const visibility = { ...base.visibility, ...(src.visibility && typeof src.visibility === 'object' ? src.visibility : {}) };
  visibility.desktop = visibility.desktop !== false;
  visibility.tablet = visibility.tablet !== false;
  visibility.mobile = visibility.mobile !== false;

  const spacing = { ...base.spacing, ...(src.spacing && typeof src.spacing === 'object' ? src.spacing : {}) };
  for (const key of ['paddingTop', 'paddingBottom', 'marginTop', 'marginBottom']) {
    if (!SPACING_PRESET_KEYS.includes(spacing[key])) spacing[key] = base.spacing[key];
  }

  const background = { ...base.background, ...(src.background && typeof src.background === 'object' ? src.background : {}) };
  if (!['none', 'solid', 'gradient', 'image'].includes(background.type)) background.type = 'none';

  const typography = { ...base.typography, ...(src.typography && typeof src.typography === 'object' ? src.typography : {}) };
  if (!TYPOGRAPHY_HEADING_SIZE_KEYS.includes(typography.headingSize)) typography.headingSize = 'default';
  if (!TYPOGRAPHY_BODY_SIZE_KEYS.includes(typography.bodySize)) typography.bodySize = 'default';
  if (!TYPOGRAPHY_ALIGN_KEYS.includes(typography.alignment)) typography.alignment = 'default';
  if (!TYPOGRAPHY_WEIGHT_KEYS.includes(typography.weight)) typography.weight = 'default';
  if (!TYPOGRAPHY_MAX_WIDTH_KEYS.includes(typography.maxTextWidth)) typography.maxTextWidth = 'default';

  const grid = { ...base.grid, ...(src.grid && typeof src.grid === 'object' ? src.grid : {}) };
  for (const bp of ['desktop', 'tablet', 'mobile']) {
    const n = Number(grid[bp]);
    grid[bp] = GRID_COLUMN_OPTIONS.includes(n) ? n : base.grid[bp];
  }

  return {
    visibility,
    containerWidth: CONTAINER_WIDTH_KEYS.includes(src.containerWidth) ? src.containerWidth : base.containerWidth,
    spacing,
    background,
    typography,
    grid,
    animation: ANIMATION_PRESET_KEYS.includes(src.animation) ? src.animation : base.animation,
    stylePreset: STYLE_PRESET_KEYS.includes(src.stylePreset) ? src.stylePreset : base.stylePreset,
  };
}

/**
 * @param {PageBlock} block
 */
export function getBlockLayoutSettings(block) {
  return normalizeBlockLayoutSettings(block?.metadata?.layout);
}

/**
 * @param {PageBlock} block
 * @param {Partial<BlockLayoutSettings>} patch
 */
export function mergeBlockLayoutSettings(block, patch) {
  const current = getBlockLayoutSettings(block);
  return normalizeBlockLayoutSettings({
    ...current,
    ...patch,
    visibility: { ...current.visibility, ...patch.visibility },
    spacing: { ...current.spacing, ...patch.spacing },
    background: { ...current.background, ...patch.background },
    typography: { ...current.typography, ...patch.typography },
    grid: { ...current.grid, ...patch.grid },
  });
}

/**
 * @param {BlockLayoutSettings} layout
 */
export function isLayoutVisibleAnywhere(layout) {
  return Boolean(layout.visibility?.desktop || layout.visibility?.tablet || layout.visibility?.mobile);
}

/**
 * @param {BlockLayoutSettings['visibility']} visibility
 */
export function resolveVisibilityClasses(visibility) {
  const d = visibility?.desktop !== false;
  const t = visibility?.tablet !== false;
  const m = visibility?.mobile !== false;

  if (d && t && m) return '';
  if (!d && !t && !m) return 'hidden';

  if (d && t && !m) return 'hidden md:block';
  if (d && !t && m) return 'block md:hidden lg:block';
  if (!d && t && m) return 'block lg:hidden';
  if (d && !t && !m) return 'hidden lg:block';
  if (!d && t && !m) return 'hidden md:block lg:hidden';
  if (!d && !t && m) return 'block md:hidden';

  return '';
}

/**
 * @param {BlockLayoutSettings} layout
 */
export function resolveSpacingStyle(layout) {
  const s = layout.spacing || {};
  return {
    paddingTop: SPACING_PRESETS[s.paddingTop] ?? 0,
    paddingBottom: SPACING_PRESETS[s.paddingBottom] ?? 0,
    marginTop: SPACING_PRESETS[s.marginTop] ?? 0,
    marginBottom: SPACING_PRESETS[s.marginBottom] ?? 0,
  };
}

function isValidHexColor(value) {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(String(value || '').trim());
}

/**
 * @param {string} hex
 */
export function relativeLuminance(hex) {
  const normalized = String(hex).replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;
  if (full.length !== 6) return 1;
  const rgb = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * @param {string} fg
 * @param {string} bg
 */
export function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * @param {BlockLayoutSettings} layout
 * @param {string} blockType
 */
export function validateBlockLayoutSettings(layout, blockType = '') {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const normalized = normalizeBlockLayoutSettings(layout);

  if (!isLayoutVisibleAnywhere(normalized)) {
    errors.push('Block is hidden on all breakpoints');
  }

  for (const key of ['paddingTop', 'paddingBottom', 'marginTop', 'marginBottom']) {
    if (!SPACING_PRESET_KEYS.includes(normalized.spacing[key])) {
      errors.push(`Invalid spacing preset: ${key}`);
    }
  }

  const bg = normalized.background;
  if (bg.type === 'solid' && bg.color && !isValidHexColor(bg.color)) {
    errors.push('Background color must be a valid hex color');
  }
  if (bg.type === 'gradient') {
    if (bg.gradientFrom && !isValidHexColor(bg.gradientFrom)) errors.push('Gradient start color is invalid');
    if (bg.gradientTo && !isValidHexColor(bg.gradientTo)) errors.push('Gradient end color is invalid');
  }
  if (bg.type === 'image' && !String(bg.imageUrl || '').trim()) {
    errors.push('Background image URL is required when background type is image');
  }
  const overlay = Number(bg.overlayOpacity);
  if (Number.isNaN(overlay) || overlay < 0 || overlay > 100) {
    errors.push('Overlay opacity must be between 0 and 100');
  }

  if (GRID_BLOCK_TYPES.has(blockType)) {
    const { desktop, tablet, mobile } = normalized.grid;
    if (tablet > desktop) errors.push('Tablet columns cannot exceed desktop columns');
    if (mobile > tablet) errors.push('Mobile columns cannot exceed tablet columns');
  }

  if (bg.type === 'solid' && bg.color && normalized.stylePreset === 'dark') {
    warnings.push('Solid background combined with dark preset — verify contrast');
  }
  if (bg.type === 'solid' && bg.color) {
    const ratio = contrastRatio(THEME_COLOR_TOKENS.textBody, bg.color);
    if (ratio < 4.5) warnings.push('Background color may not meet AA contrast with body text');
  }

  return { errors, warnings, normalized };
}

/**
 * @param {{ desktop: number; tablet: number; mobile: number }} grid
 */
export function resolveResponsiveGridClasses(grid) {
  const m = Math.min(6, Math.max(1, Number(grid.mobile) || 1));
  const t = Math.min(6, Math.max(1, Number(grid.tablet) || 2));
  const d = Math.min(6, Math.max(1, Number(grid.desktop) || 3));

  const mobileMap = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6' };
  const tabletMap = { 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4', 5: 'md:grid-cols-5', 6: 'md:grid-cols-6' };
  const desktopMap = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6' };

  return `grid ${mobileMap[m] || 'grid-cols-1'} ${tabletMap[t] || 'md:grid-cols-2'} ${desktopMap[d] || 'lg:grid-cols-3'}`;
}

/**
 * @param {string} layout
 */
export function legacyGalleryLayoutToGrid(layout) {
  const map = {
    'grid-2': { desktop: 2, tablet: 2, mobile: 1 },
    'grid-3': { desktop: 3, tablet: 2, mobile: 1 },
    'grid-4': { desktop: 4, tablet: 2, mobile: 2 },
  };
  return map[layout] || map['grid-3'];
}

/**
 * @param {PageBlock} block
 */
export function resolveBlockGridSettings(block) {
  const layout = getBlockLayoutSettings(block);
  const hasCustomGrid = block?.metadata?.layout?.grid != null;
  if (hasCustomGrid) return layout.grid;
  if (block.type === 'gallery' && block.config?.layout) {
    return legacyGalleryLayoutToGrid(block.config.layout);
  }
  if (block.type === 'feature-cards') {
    const cols = String(block.config?.columns || '3');
    const n = Number(cols) || 3;
    return { desktop: n, tablet: Math.min(n, 2), mobile: 1 };
  }
  return layout.grid;
}
