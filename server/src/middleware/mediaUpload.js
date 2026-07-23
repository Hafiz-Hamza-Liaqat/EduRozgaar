import multer from 'multer';
import { rejectDangerousFilename } from '../utils/fileValidation.js';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB per file

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const storage = multer.memoryStorage();

const mediaMulter = multer({
  storage,
  limits: { fileSize: MAX_SIZE, files: 20 },
  fileFilter: (req, file, cb) => {
    try {
      rejectDangerousFilename(file.originalname);
      if (IMAGE_TYPES.has(file.mimetype)) cb(null, true);
      else cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'), false);
    } catch (err) {
      cb(err, false);
    }
  },
});

export const uploadMediaFiles = mediaMulter.array('files', 20);
