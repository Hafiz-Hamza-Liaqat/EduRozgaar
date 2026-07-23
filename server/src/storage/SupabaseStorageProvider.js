import crypto from 'crypto';
import path from 'path';
import { extensionFromMime, rejectDangerousFilename } from '../utils/fileValidation.js';
import { StorageProviderError } from './StorageProvider.js';

function configured() {
  return Boolean(
    process.env.SUPABASE_URL
    && process.env.SUPABASE_SERVICE_ROLE_KEY
    && process.env.SUPABASE_STORAGE_BUCKET,
  );
}

function baseUrl() {
  return process.env.SUPABASE_URL.replace(/\/$/, '');
}

function publicUrl(key) {
  const cdn = process.env.SUPABASE_CDN_URL?.replace(/\/$/, '');
  if (cdn) return `${cdn}/${key}`;
  return `${baseUrl()}/storage/v1/object/public/${process.env.SUPABASE_STORAGE_BUCKET}/${key}`;
}

/** @type {import('./StorageProvider.js').StorageProvider} */
export const supabaseStorageProvider = {
  name: 'supabase',

  isConfigured() {
    return configured();
  },

  async upload({ buffer, filename, folder, mimetype, key: explicitKey }) {
    if (!configured()) {
      throw new StorageProviderError('Supabase storage is not configured', 'NOT_CONFIGURED');
    }
    if (!buffer?.length) throw new StorageProviderError('Empty file');
    rejectDangerousFilename(filename);

    const ext = extensionFromMime(mimetype) || path.extname(filename) || '.bin';
    const safeFolder = String(folder || 'media').replace(/[^a-zA-Z0-9/_-]/g, '');
    const key = explicitKey
      ? String(explicitKey).replace(/\\/g, '/').replace(/^\/+/, '')
      : `${safeFolder}/${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;

    const url = `${baseUrl()}/storage/v1/object/${process.env.SUPABASE_STORAGE_BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': mimetype,
        'x-upsert': 'true',
        'cache-control': mimetype.startsWith('image/')
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=86400',
      },
      body: buffer,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new StorageProviderError(`Supabase upload failed: ${res.status} ${text}`, 'UPLOAD_FAILED');
    }

    return { url: publicUrl(key), key, provider: 'supabase' };
  },

  async delete({ key }) {
    if (!configured() || !key) return;
    const url = `${baseUrl()}/storage/v1/object/${process.env.SUPABASE_STORAGE_BUCKET}/${key}`;
    await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
    });
  },
};
