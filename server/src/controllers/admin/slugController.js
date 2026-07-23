import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  SLUG_RESOURCE_TYPES,
  checkSlugAvailability,
} from '../../services/slugService.js';

export const checkSlug = asyncHandler(async (req, res) => {
  const { type, slug, excludeId, locale } = req.query;
  if (!type || !SLUG_RESOURCE_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Invalid or missing type parameter.' });
  }
  if (!slug || !String(slug).trim()) {
    return res.status(400).json({
      valid: false,
      available: false,
      message: 'Slug contains invalid characters.',
      previewUrl: '',
    });
  }

  const result = await checkSlugAvailability({
    resourceType: type,
    slug: String(slug),
    excludeId: excludeId || undefined,
    locale: locale || undefined,
  });

  res.json(result);
});
