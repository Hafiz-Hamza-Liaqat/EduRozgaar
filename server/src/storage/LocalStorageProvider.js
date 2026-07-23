import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { extensionFromMime, rejectDangerousFilename } from '../utils/fileValidation.js';
import { StorageProviderError } from './StorageProvider.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_UPLOAD_DIR = path.join(__dirname, '../../uploads');

/** @type {import('./StorageProvider.js').StorageProvider} */
export const localStorageProvider = {
  name: 'local',

  isConfigured() {
    return true;
  },

  async upload({ buffer, filename, folder, mimetype, key: explicitKey }) {
    if (!buffer?.length) throw new StorageProviderError('Empty file');
    rejectDangerousFilename(filename);
    const ext = extensionFromMime(mimetype) || path.extname(filename) || '.bin';
    const safeFolder = String(folder || 'media').replace(/[^a-zA-Z0-9/_-]/g, '');
    const dir = path.join(LOCAL_UPLOAD_DIR, safeFolder);
    await fs.mkdir(dir, { recursive: true });
    const key = explicitKey
      ? String(explicitKey).replace(/\\/g, '/').replace(/^\/+/, '')
      : `${safeFolder}/${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
    const filepath = path.join(LOCAL_UPLOAD_DIR, key);
    await fs.writeFile(filepath, buffer);
    const base = (process.env.SITE_URL || 'http://localhost:5000').replace(/\/$/, '');
    return { url: `${base}/uploads/${key.replace(/\\/g, '/')}`, key, provider: 'local' };
  },

  async delete({ key }) {
    if (!key) return;
    const filepath = path.join(LOCAL_UPLOAD_DIR, key);
    try {
      await fs.unlink(filepath);
    } catch {
      // ignore missing
    }
  },
};
