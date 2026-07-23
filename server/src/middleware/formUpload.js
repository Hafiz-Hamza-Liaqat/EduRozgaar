import multer from 'multer';
import { rejectDangerousFilename } from '../utils/fileValidation.js';

const MAX_SIZE = 10 * 1024 * 1024;

const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
]);

const storage = multer.memoryStorage();

const formFileFilter = (req, file, cb) => {
  try {
    rejectDangerousFilename(file.originalname);
    if (ALLOWED.has(file.mimetype)) cb(null, true);
    else cb(new Error('File type not allowed'), false);
  } catch (err) {
    cb(err, false);
  }
};

export const uploadFormFileMw = multer({
  storage,
  limits: { fileSize: MAX_SIZE, files: 5 },
  fileFilter: formFileFilter,
}).single('file');

export const uploadFormSubmitFilesMw = multer({
  storage,
  limits: { fileSize: MAX_SIZE, files: 5 },
  fileFilter: formFileFilter,
}).any();
