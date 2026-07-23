import crypto from 'crypto';
import path from 'path';
import { extensionFromMime, rejectDangerousFilename } from '../utils/fileValidation.js';
import { StorageProviderError } from './StorageProvider.js';

function configured() {
  return Boolean(
    process.env.AWS_S3_BUCKET
    && process.env.AWS_ACCESS_KEY_ID
    && process.env.AWS_SECRET_ACCESS_KEY,
  );
}

function publicUrl(key) {
  const cdn = process.env.AWS_S3_CDN_URL?.replace(/\/$/, '');
  if (cdn) return `${cdn}/${key}`;
  const region = process.env.AWS_REGION || 'us-east-1';
  const bucket = process.env.AWS_S3_BUCKET;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

async function getS3Client() {
  const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
  const client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  return { client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, getSignedUrl };
}

/** @type {import('./StorageProvider.js').StorageProvider} */
export const s3StorageProvider = {
  name: 's3',

  isConfigured() {
    return configured();
  },

  async upload({ buffer, filename, folder, mimetype, key: explicitKey }) {
    if (!configured()) {
      throw new StorageProviderError('S3 storage is not configured', 'NOT_CONFIGURED');
    }
    if (!buffer?.length) throw new StorageProviderError('Empty file');
    rejectDangerousFilename(filename);

    const ext = extensionFromMime(mimetype) || path.extname(filename) || '.bin';
    const safeFolder = String(folder || 'media').replace(/[^a-zA-Z0-9/_-]/g, '');
    const key = explicitKey
      ? String(explicitKey).replace(/\\/g, '/').replace(/^\/+/, '')
      : `${safeFolder}/${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;

    const { client, PutObjectCommand } = await getS3Client();
    const cacheControl = mimetype.startsWith('image/')
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=86400';

    await client.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      CacheControl: cacheControl,
    }));

    return { url: publicUrl(key), key, provider: 's3' };
  },

  async delete({ key }) {
    if (!configured() || !key) return;
    const { client, DeleteObjectCommand } = await getS3Client();
    await client.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    }));
  },

  async getSignedUrl(key, expiresInSec = 3600) {
    if (!configured() || !key) return null;
    const { client, GetObjectCommand, getSignedUrl } = await getS3Client();
    return getSignedUrl(client, new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    }), { expiresIn: expiresInSec });
  },
};
