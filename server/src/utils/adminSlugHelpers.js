import { resolveSlugForSave } from '../services/slugService.js';

/**
 * Apply resolved slug to a mongoose document before save.
 * @returns {string|null} error message or null on success
 */
export async function applyResolvedSlug(resourceType, doc, body, isCreate) {
  const result = await resolveSlugForSave({ resourceType, doc, body, isCreate });
  if (result.error) return result.error;
  doc.slug = result.slug;
  return null;
}

export function slugErrorResponse(res, message) {
  return res.status(400).json({ error: message });
}
