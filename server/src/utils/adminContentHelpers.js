import { sanitizeString } from '../utils/sanitize.js';

export function parseStringArray(val) {
  if (Array.isArray(val)) return val.map(sanitizeString).filter(Boolean);
  if (typeof val === 'string' && val.trim()) {
    return val.split(/[\n,]/).map((s) => sanitizeString(s.trim())).filter(Boolean);
  }
  return undefined;
}

export function pickBool(val) {
  if (val === undefined || val === null) return undefined;
  return val === true || val === 'true' || val === 1 || val === '1';
}
