import { validateImageBuffer } from '../../utils/fileValidation.js';
import { uploadFile } from '../../services/storageService.js';
import { logger } from '../../utils/logger.js';

export async function uploadAdminImage(req, res, next) {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'No image file uploaded. Use multipart field name "image".' });
    }
    const mimetype = await validateImageBuffer(req.file.buffer, req.file.mimetype);
    const result = await uploadFile({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype,
      folder: 'edurozgaar/admin',
    });
    return res.status(201).json({ url: result.url, storage: result.storage });
  } catch (err) {
    if (err.status === 400) {
      logger.warn('upload_rejected', { reason: err.message, userId: req.user?.userId });
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}
