/**
 * Page Builder design tokens (C.6.4.14).
 * Single source of truth — no magic numbers in components.
 */

/** @typedef {'none'|'xs'|'s'|'m'|'l'|'xl'} SpacingPreset */
/** @typedef {'contained'|'wide'|'full'} ContainerWidthPreset */
/** @typedef {'default'|'primary'|'secondary'|'light'|'dark'|'accent'} StylePreset */
/** @typedef {'none'|'fade'|'slide-up'|'zoom'} AnimationPreset */
/** @typedef {'none'|'solid'|'gradient'|'image'} BackgroundType */

export const SPACING_PRESET_KEYS = ['none', 'xs', 's', 'm', 'l', 'xl'];

/** Spacing in pixels */
export const SPACING_PRESETS = {
  none: 0,
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 48,
};

export const SPACING_PRESET_LABELS = {
  none: 'None',
  xs: 'XS',
  s: 'S',
  m: 'M',
  l: 'L',
  xl: 'XL',
};

export const CONTAINER_WIDTH_KEYS = ['contained', 'wide', 'full'];

/** Tailwind max-width / width classes */
export const CONTAINER_WIDTH_CLASSES = {
  contained: 'max-w-screen-xl w-full mx-auto',
  wide: 'max-w-screen-2xl w-full mx-auto',
  full: 'w-full max-w-none',
};

export const CONTAINER_WIDTH_LABELS = {
  contained: 'Contained',
  wide: 'Wide',
  full: 'Full width',
};

export const STYLE_PRESET_KEYS = ['default', 'primary', 'secondary', 'light', 'dark', 'accent'];

/** Theme-linked surface classes — never duplicate hex values here */
export const STYLE_PRESET_CLASSES = {
  default: {
    surface: '',
    text: '',
  },
  primary: {
    surface: 'bg-primary/5 dark:bg-primary/10',
    text: '',
  },
  secondary: {
    surface: 'bg-bg-section dark:bg-secondary-light',
    text: '',
  },
  light: {
    surface: 'bg-white dark:bg-gray-900',
    text: '',
  },
  dark: {
    surface: 'bg-secondary dark:bg-secondary',
    text: 'text-white',
  },
  accent: {
    surface: 'bg-primary-light dark:bg-primary/20',
    text: '',
  },
};

export const STYLE_PRESET_LABELS = {
  default: 'Default',
  primary: 'Primary',
  secondary: 'Secondary',
  light: 'Light',
  dark: 'Dark',
  accent: 'Accent',
};

export const TYPOGRAPHY_HEADING_SIZE_KEYS = ['default', 'sm', 'md', 'lg', 'xl'];
export const TYPOGRAPHY_BODY_SIZE_KEYS = ['default', 'sm', 'md', 'lg'];
export const TYPOGRAPHY_ALIGN_KEYS = ['default', 'left', 'center', 'right'];
export const TYPOGRAPHY_WEIGHT_KEYS = ['default', 'normal', 'medium', 'semibold', 'bold'];
export const TYPOGRAPHY_MAX_WIDTH_KEYS = ['default', 'narrow', 'medium', 'wide', 'full'];

export const TYPOGRAPHY_HEADING_CLASSES = {
  default: '',
  sm: 'text-xl sm:text-2xl',
  md: 'text-2xl sm:text-3xl',
  lg: 'text-3xl sm:text-4xl',
  xl: 'text-4xl sm:text-5xl',
};

export const TYPOGRAPHY_BODY_CLASSES = {
  default: '',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export const TYPOGRAPHY_ALIGN_CLASSES = {
  default: '',
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export const TYPOGRAPHY_WEIGHT_CLASSES = {
  default: '',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export const TYPOGRAPHY_MAX_WIDTH_CLASSES = {
  default: '',
  narrow: 'max-w-prose',
  medium: 'max-w-2xl',
  wide: 'max-w-4xl',
  full: 'max-w-none',
};

export const ANIMATION_PRESET_KEYS = ['none', 'fade', 'slide-up', 'zoom'];

export const ANIMATION_PRESET_LABELS = {
  none: 'None',
  fade: 'Fade',
  'slide-up': 'Slide up',
  zoom: 'Zoom',
};

/** CSS classes applied when element enters viewport */
export const ANIMATION_ENTER_CLASSES = {
  none: '',
  fade: 'pb-animate-fade',
  'slide-up': 'pb-animate-slide-up',
  zoom: 'pb-animate-zoom',
};

export const BREAKPOINTS = {
  tabletMin: 768,
  desktopMin: 1024,
};

export const GRID_COLUMN_OPTIONS = [1, 2, 3, 4, 5, 6];

export const RADIUS_PRESETS = {
  none: '0',
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
};

export const SHADOW_PRESETS = {
  none: 'none',
  sm: '0 1px 2px rgba(15, 23, 42, 0.06)',
  md: '0 4px 20px rgba(0, 0, 0, 0.05)',
  lg: '0 10px 25px rgba(0, 0, 0, 0.08)',
};

/** Theme color keys for presets (maps to tailwind.config.js) */
export const THEME_COLOR_TOKENS = {
  primary: '#635BFF',
  primaryHover: '#4F46E5',
  primaryLight: '#E0E7FF',
  secondary: '#0F172A',
  bgMain: '#F8FAFC',
  bgSection: '#F1F5F9',
  textHeading: '#0F172A',
  textBody: '#334155',
  white: '#FFFFFF',
};

export const GRID_BLOCK_TYPES = new Set(['feature-cards', 'gallery', 'logo-grid', 'student-resources']);
