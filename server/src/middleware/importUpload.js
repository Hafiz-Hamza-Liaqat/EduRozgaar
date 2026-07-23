import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { rejectDangerousFilename } from '../utils/fileValidation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads/imports');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    try {
      rejectDangerousFilename(file.originalname);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`);
    } catch (err) {
      cb(err, false);
    }
  },
});

const ALLOWED = ['.json', '.csv', '.xlsx', '.xls'];

export const importUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    try {
      rejectDangerousFilename(file.originalname);
      const ext = path.extname(file.originalname).toLowerCase();
      if (!ALLOWED.includes(ext)) {
        return cb(new Error('Only JSON, CSV, and Excel files are allowed'));
      }
      cb(null, true);
    } catch (err) {
      cb(err, false);
    }
  },
});
