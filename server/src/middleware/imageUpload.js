import multer from 'multer';
import { rejectDangerousFilename } from '../utils/fileValidation.js';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/** Raster/icon images only — SVG rejected (XSS when served from /uploads). */
const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

const storage = multer.memoryStorage();

export const uploadAdminImage = multer({
  storage,
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    try {
      rejectDangerousFilename(file.originalname);
      if (IMAGE_TYPES.has(file.mimetype)) cb(null, true);
      else cb(new Error('Only JPEG, PNG, GIF, WebP, and ICO images are allowed'), false);
    } catch (err) {
      cb(err, false);
    }
  },
}).single('image');
