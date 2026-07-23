import mongoose from 'mongoose';
import { MediaAsset } from '../models/MediaAsset.js';
import { computeChecksum, deleteAssetFiles, processAndUploadImageVariants } from './mediaImageProcessor.js';

const SORT_FIELDS = new Set(['createdAt', 'filename', 'fileSize', 'originalFilename']);

/**
 * @param {object} query
 */
export function buildMediaListQuery(query = {}) {
  const filter = {};
  if (query.folder) filter.folder = String(query.folder).trim();
  if (query.mimeType) filter.mimeType = String(query.mimeType).trim();
  if (query.tag) filter.tags = String(query.tag).trim();
  const search = String(query.search || query.q || '').trim();
  if (search) {
    filter.$or = [
      { filename: { $regex: escapeRegex(search), $options: 'i' } },
      { originalFilename: { $regex: escapeRegex(search), $options: 'i' } },
      { altText: { $regex: escapeRegex(search), $options: 'i' } },
      { caption: { $regex: escapeRegex(search), $options: 'i' } },
      { tags: { $regex: escapeRegex(search), $options: 'i' } },
    ];
  }
  return filter;
}

/**
 * @param {object} query
 */
export function buildMediaListOptions(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 24));
  const sortField = SORT_FIELDS.has(query.sort) ? query.sort : 'createdAt';
  const sortDir = query.order === 'asc' ? 1 : -1;
  return { page, limit, sort: { [sortField]: sortDir }, skip: (page - 1) * limit };
}

/**
 * @param {object} params
 */
export async function listMediaAssets(params = {}) {
  const filter = buildMediaListQuery(params);
  const { page, limit, sort, skip } = buildMediaListOptions(params);
  const [items, total] = await Promise.all([
    MediaAsset.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'name email')
      .lean(),
    MediaAsset.countDocuments(filter),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) || 1 };
}

export async function listMediaFolders() {
  const folders = await MediaAsset.distinct('folder');
  return folders.filter(Boolean).sort();
}

/**
 * @param {string} id
 */
export async function getMediaAssetById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return MediaAsset.findById(id).populate('uploadedBy', 'name email').lean();
}

/**
 * @param {{ file: { buffer: Buffer; originalname: string; mimetype: string; size: number }; folder?: string; altText?: string; uploadedBy?: string; allowDuplicate?: boolean }} opts
 */
export async function uploadMediaAsset(opts) {
  const { file, folder = 'general', altText = '', uploadedBy, allowDuplicate = false } = opts;
  const checksum = computeChecksum(file.buffer);
  const existing = await MediaAsset.findOne({ checksum }).lean();
  if (existing && !allowDuplicate) {
    return { duplicate: true, asset: existing };
  }

  const assetId = new mongoose.Types.ObjectId();
  const processed = await processAndUploadImageVariants({
    buffer: file.buffer,
    mimetype: file.mimetype,
    assetId: String(assetId),
    originalFilename: file.originalname,
  });

  const doc = await MediaAsset.create({
    _id: assetId,
    filename: file.originalname,
    originalFilename: file.originalname,
    mimeType: file.mimetype,
    width: processed.width,
    height: processed.height,
    fileSize: file.size,
    altText,
    folder: String(folder || 'general').trim() || 'general',
    uploadedBy,
    checksum,
    storageProvider: processed.storageProvider,
    storageKey: processed.storageKey,
    storageUrl: processed.storageUrl,
    thumbnailUrl: processed.thumbnailUrl,
    mediumUrl: processed.mediumUrl,
    largeUrl: processed.largeUrl,
    variants: processed.variants,
  });

  return { duplicate: false, asset: doc.toObject() };
}

/**
 * @param {string} id
 * @param {object} patch
 */
export async function updateMediaAsset(id, patch = {}) {
  const allowed = [
    'filename', 'altText', 'caption', 'folder', 'tags',
    'metadata',
  ];
  const update = {};
  for (const key of allowed) {
    if (patch[key] !== undefined) update[key] = patch[key];
  }
  if (Array.isArray(patch.tags)) {
    update.tags = patch.tags.map((t) => String(t).trim()).filter(Boolean);
  }
  if (patch.metadata && typeof patch.metadata === 'object') {
    update.metadata = {
      credit: patch.metadata.credit ?? '',
      copyright: patch.metadata.copyright ?? '',
      photographer: patch.metadata.photographer ?? '',
      license: patch.metadata.license ?? '',
      description: patch.metadata.description ?? '',
    };
  }
  return MediaAsset.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean();
}

/**
 * @param {string} id
 * @param {{ force?: boolean }} opts
 */
export async function deleteMediaAsset(id, opts = {}) {
  const asset = await MediaAsset.findById(id);
  if (!asset) return { ok: false, reason: 'NOT_FOUND' };
  if (!opts.force) {
    const { findMediaAssetUsage } = await import('./mediaUsageService.js');
    const usage = await findMediaAssetUsage(asset);
    if (usage.length) return { ok: false, reason: 'IN_USE', usage };
  }
  await deleteAssetFiles(asset);
  await asset.deleteOne();
  return { ok: true };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Register uploaded file as MediaAsset (C.8.0.5 — reuses storageService, no new upload route).
 */
export async function createMediaAssetFromBuffer({ buffer, originalname, mimetype, folder = 'general', uploadedBy }) {
  const { uploadFile } = await import('./storageService.js');
  const uploaded = await uploadFile({ buffer, originalname, mimetype, folder });
  const checksum = computeChecksum(buffer);

  const existing = await MediaAsset.findOne({ checksum }).lean();
  if (existing) return existing;

  const doc = await MediaAsset.create({
    filename: originalname,
    originalFilename: originalname,
    mimeType: mimetype,
    fileSize: buffer.length,
    folder: String(folder || 'general').trim() || 'general',
    uploadedBy,
    checksum,
    storageProvider: uploaded.storage,
    storageUrl: uploaded.url,
    thumbnailUrl: uploaded.url,
    mediumUrl: uploaded.url,
    largeUrl: uploaded.url,
    variants: { original: uploaded.url },
  });

  return doc.toObject ? doc.toObject() : doc;
}
