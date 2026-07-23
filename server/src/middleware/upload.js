import multer from 'multer';
import { rejectDangerousFilename } from '../utils/fileValidation.js';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const storage = multer.memoryStorage();

const ALLOWED = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const uploadResume = multer({
  storage,
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    try {
      rejectDangerousFilename(file.originalname);
      if (ALLOWED.has(file.mimetype)) cb(null, true);
      else cb(new Error('Only PDF and DOCX allowed'), false);
    } catch (err) {
      cb(err, false);
    }
  },
}).single('resume');
