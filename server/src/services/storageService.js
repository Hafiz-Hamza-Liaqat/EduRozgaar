import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { extensionFromMime, rejectDangerousFilename } from '../utils/fileValidation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_UPLOAD_DIR = path.join(__dirname, '../../uploads');

let cloudinary = null;

async function getCloudinary() {
  if (cloudinary) return cloudinary;
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return null;
  const mod = await import('cloudinary');
  const v2 = mod.v2 || mod.default?.v2;
  v2.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
  cloudinary = v2;
  return cloudinary;
}

/**
 * Upload a buffer (from multer). Uses Cloudinary when configured, else local disk.
 * @returns {Promise<{ url: string, publicId?: string, storage: 'cloudinary'|'local' }>}
 */
export async function uploadFile({ buffer, originalname, mimetype, folder = 'edurozgaar' }) {
  if (!buffer?.length) throw new Error('Empty file');
  rejectDangerousFilename(originalname);

  const cld = await getCloudinary();
  if (cld) {
    const b64 = buffer.toString('base64');
    const dataUri = `data:${mimetype};base64,${b64}`;
    const safeId = `${folder}/${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const result = await cld.uploader.upload(dataUri, {
      folder,
      resource_type: 'auto',
      public_id: safeId,
    });
    return { url: result.secure_url, publicId: result.public_id, storage: 'cloudinary' };
  }

  await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  const ext = extensionFromMime(mimetype) || '.bin';
  const filename = `${Date.now()}_${crypto.randomBytes(12).toString('hex')}${ext}`;
  const filepath = path.join(LOCAL_UPLOAD_DIR, filename);
  await fs.writeFile(filepath, buffer);
  const base = (process.env.SITE_URL || 'http://localhost:5000').replace(/\/$/, '');
  return { url: `${base}/uploads/${filename}`, storage: 'local' };
}
