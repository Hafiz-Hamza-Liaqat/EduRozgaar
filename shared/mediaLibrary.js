/**
 * Media Library shared constants & helpers (C.7.0.1).
 */

export const MEDIA_VARIANTS = ['thumbnail', 'medium', 'large', 'original'];

export const MEDIA_VARIANT_WIDTHS = {
  thumbnail: 320,
  medium: 800,
  large: 1600,
};

export const MEDIA_STORAGE_PROVIDERS = ['local', 'supabase', 's3'];

export const DEFAULT_MEDIA_FOLDER = 'general';

export const IMAGE_FIELD_KEY_PATTERN = /image|photo|logo|avatar|background|banner|og/i;

/**
 * @param {{ key?: string; type?: string }} field
 */
export function isMediaPickerField(field) {
  if (!field) return false;
  if (field.type === 'url' && IMAGE_FIELD_KEY_PATTERN.test(field.key || '')) return true;
  return false;
}

/**
 * @param {string} checksum
 * @param {string} existingChecksum
 */
export function isDuplicateChecksum(checksum, existingChecksum) {
  return Boolean(checksum && existingChecksum && checksum === existingChecksum);
}
