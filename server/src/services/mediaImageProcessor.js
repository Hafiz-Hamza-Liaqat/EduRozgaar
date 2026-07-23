import crypto from 'crypto';
import { MEDIA_VARIANT_WIDTHS } from '../../../shared/mediaLibrary.js';
import { getStorageProvider } from '../storage/index.js';
import { extensionFromMime } from '../utils/fileValidation.js';

let sharpModule = null;

async function getSharp() {
  if (sharpModule !== null) return sharpModule;
  try {
    const mod = await import('sharp');
    sharpModule = mod.default || mod;
  } catch {
    sharpModule = false;
  }
  return sharpModule;
}

/**
 * @param {Buffer} buffer
 */
export function computeChecksum(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Generate image variants and upload via storage provider.
 * @param {{ buffer: Buffer; mimetype: string; assetId: string; originalFilename: string }} opts
 */
export async function processAndUploadImageVariants(opts) {
  const { buffer, mimetype, assetId, originalFilename } = opts;
  const provider = getStorageProvider();
  const ext = extensionFromMime(mimetype) || '.jpg';
  const baseKey = `media/${assetId}`;
  const sharp = await getSharp();

  let width = 0;
  let height = 0;
  const variants = {};

  if (sharp) {
    const image = sharp(buffer, { failOn: 'none' });
    const meta = await image.metadata();
    width = meta.width || 0;
    height = meta.height || 0;

    for (const [variant, maxWidth] of Object.entries(MEDIA_VARIANT_WIDTHS)) {
      const out = await sharp(buffer)
        .resize({ width: maxWidth, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      const key = `${baseKey}/${variant}.webp`;
      const uploaded = await provider.upload({
        buffer: out,
        filename: `${variant}.webp`,
        folder: baseKey,
        mimetype: 'image/webp',
        key,
      });
      variants[variant] = uploaded.url;
    }
  }

  const originalKey = `${baseKey}/original${ext}`;
  const originalUpload = await provider.upload({
    buffer,
    filename: originalFilename || `original${ext}`,
    folder: baseKey,
    mimetype,
    key: originalKey,
  });
  variants.original = originalUpload.url;

  if (!width || !height) {
    const sharpRetry = await getSharp();
    if (sharpRetry) {
      const meta = await sharpRetry(buffer).metadata();
      width = meta.width || 0;
      height = meta.height || 0;
    }
  }

  return {
    width,
    height,
    variants,
    storageUrl: variants.original,
    thumbnailUrl: variants.thumbnail || variants.original,
    mediumUrl: variants.medium || variants.original,
    largeUrl: variants.large || variants.original,
    storageKey: originalKey,
    storageProvider: provider.name,
  };
}

/**
 * Delete all variant files for an asset.
 * @param {import('../models/MediaAsset.js').MediaAsset} asset
 */
export async function deleteAssetFiles(asset) {
  const provider = getStorageProvider(asset.storageProvider);
  const keys = new Set();
  if (asset.storageKey) keys.add(asset.storageKey);
  const variantUrls = asset.variants || {};
  for (const url of Object.values(variantUrls)) {
    const key = urlToStorageKey(url);
    if (key) keys.add(key);
  }
  for (const key of keys) {
    await provider.delete({ key });
  }
}

/**
 * @param {string} url
 */
function urlToStorageKey(url) {
  if (!url) return '';
  const match = String(url).match(/\/uploads\/(.+)$/i);
  return match ? match[1] : '';
}
