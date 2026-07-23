import mongoose from 'mongoose';
import { FormSubmission } from '../models/FormSubmission.js';
import { getStorageProvider } from '../storage/index.js';
import { MediaAsset } from '../models/MediaAsset.js';
import { computeChecksum } from './mediaImageProcessor.js';
import { extensionFromMime, rejectDangerousFilename } from '../utils/fileValidation.js';

const DEFAULT_ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
]);

/**
 * Upload form file via Media Library storage infrastructure.
 * @param {{ buffer: Buffer; originalname: string; mimetype: string; size: number; formSlug: string; fieldName: string }} opts
 */
export async function uploadFormFile(opts) {
  const { buffer, originalname, mimetype, size, formSlug, fieldName } = opts;
  rejectDangerousFilename(originalname);
  if (!DEFAULT_ALLOWED.has(mimetype)) {
    throw new Error('File type not allowed');
  }
  const maxSize = 10 * 1024 * 1024;
  if (size > maxSize) throw new Error('File exceeds 10MB limit');

  const provider = getStorageProvider();
  const assetId = new mongoose.Types.ObjectId();
  const folder = `forms/${formSlug}/${fieldName}`;
  const ext = extensionFromMime(mimetype) || '';
  const key = `${folder}/${assetId}${ext}`;
  const uploaded = await provider.upload({
    buffer,
    filename: originalname,
    folder,
    mimetype,
    key,
  });

  const checksum = computeChecksum(buffer);
  const asset = await MediaAsset.create({
    _id: assetId,
    filename: originalname,
    originalFilename: originalname,
    mimeType: mimetype,
    fileSize: size,
    folder: `forms/${formSlug}`,
    checksum,
    storageProvider: provider.name,
    storageKey: uploaded.key,
    storageUrl: uploaded.url,
    thumbnailUrl: uploaded.url,
    mediumUrl: uploaded.url,
    largeUrl: uploaded.url,
    variants: { original: uploaded.url },
    altText: `Form upload: ${fieldName}`,
  });

  return {
    assetId: asset._id,
    url: uploaded.url,
    filename: originalname,
    mimeType: mimetype,
    size,
  };
}

/**
 * @param {object} query
 */
export function buildSubmissionQuery(query = {}) {
  const filter = {};
  if (query.formId) filter.formId = query.formId;
  if (query.formSlug) filter.formSlug = String(query.formSlug).toLowerCase();
  if (query.status === 'new' || query.status === 'read') filter.status = query.status;
  const search = String(query.search || '').trim();
  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { formSlug: re },
      { 'data': re },
    ];
  }
  if (query.from) {
    const d = new Date(query.from);
    if (!isNaN(d.getTime())) filter.createdAt = { ...(filter.createdAt || {}), $gte: d };
  }
  if (query.to) {
    const d = new Date(query.to);
    if (!isNaN(d.getTime())) filter.createdAt = { ...(filter.createdAt || {}), $lte: d };
  }
  return filter;
}

/**
 * @param {object} params
 */
export async function listFormSubmissions(params = {}) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
  const skip = (page - 1) * limit;
  const filter = buildSubmissionQuery(params);
  const [items, total] = await Promise.all([
    FormSubmission.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    FormSubmission.countDocuments(filter),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) || 1 };
}

/**
 * @param {string} id
 */
export async function getFormSubmission(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return FormSubmission.findById(id).lean();
}

/**
 * @param {object} payload
 */
export async function createFormSubmission(payload) {
  return FormSubmission.create(payload);
}

/**
 * @param {string} id
 * @param {object} patch
 */
export async function updateFormSubmission(id, patch) {
  const update = {};
  if (patch.status === 'read' || patch.status === 'new') {
    update.status = patch.status;
    update.readAt = patch.status === 'read' ? new Date() : null;
  }
  return FormSubmission.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
}

/**
 * @param {string} id
 */
export async function deleteFormSubmission(id) {
  const doc = await FormSubmission.findByIdAndDelete(id);
  return Boolean(doc);
}

/**
 * @param {object} query
 */
export async function exportSubmissionsCsv(query = {}) {
  const filter = buildSubmissionQuery(query);
  const rows = await FormSubmission.find(filter).sort({ createdAt: -1 }).limit(5000).lean();
  return rows;
}
