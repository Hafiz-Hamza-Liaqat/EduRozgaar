import { asyncHandler } from '../../utils/asyncHandler.js';
import { DocumentService } from '../../services/career/DocumentService.js';

export const uploadProfileDocument = asyncHandler(async (req, res) => {
  if (!req.file?.buffer) {
    return res.status(400).json({ error: 'File is required' });
  }

  const doc = await DocumentService.createFromUpload(
    req.user.userId,
    req.file,
    {
      label: req.body.label,
      documentType: req.body.documentType || 'other',
      visibility: req.body.visibility || 'private',
      tags: req.body.tags ? String(req.body.tags).split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      expiresAt: req.body.expiresAt,
    },
    { type: 'talent', id: String(req.user.userId) }
  );

  res.status(201).json(doc);
});
