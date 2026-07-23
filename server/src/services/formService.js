import crypto from 'crypto';
import mongoose from 'mongoose';
import { FormDefinition } from '../models/FormDefinition.js';
import { validateFormDefinition, slugifyFormName } from '../../../shared/formSchema.js';

/**
 * @param {object} query
 */
export function buildFormListQuery(query = {}) {
  const filter = {};
  if (query.status) filter.status = String(query.status);
  if (query.category) filter.category = String(query.category);
  const search = String(query.search || query.q || '').trim();
  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: re }, { slug: re }, { description: re }];
  }
  return filter;
}

/**
 * @param {object} params
 */
export async function listFormDefinitions(params = {}) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
  const skip = (page - 1) * limit;
  const filter = buildFormListQuery(params);
  const [items, total] = await Promise.all([
    FormDefinition.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    FormDefinition.countDocuments(filter),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) || 1 };
}

/**
 * @param {string} idOrSlug
 */
export async function getFormDefinitionByIdOrSlug(idOrSlug) {
  const key = String(idOrSlug || '').trim();
  if (!key) return null;
  const byId = await FormDefinition.findById(key).lean().catch(() => null);
  if (byId) return byId;
  return FormDefinition.findOne({ slug: key.toLowerCase() }).lean();
}

/**
 * @param {string} id
 */
export async function getPublishedFormById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return FormDefinition.findOne({ _id: id, status: 'published' }).lean();
}

/**
 * @param {string} slug
 */
export async function getPublishedFormBySlug(slug) {
  return FormDefinition.findOne({ slug: String(slug).toLowerCase(), status: 'published' }).lean();
}

/**
 * @param {object} body
 * @param {string} [userId]
 */
export async function createFormDefinition(body, userId) {
  const payload = normalizeFormPayload(body);
  if (!payload.slug) payload.slug = slugifyFormName(payload.name);
  const errors = validateFormDefinition(payload);
  if (errors.length) return { ok: false, errors };
  const existing = await FormDefinition.findOne({ slug: payload.slug });
  if (existing) return { ok: false, errors: ['Slug already in use'] };
  const doc = await FormDefinition.create({ ...payload, updatedBy: userId });
  return { ok: true, form: doc.toObject() };
}

/**
 * @param {string} id
 * @param {object} body
 * @param {string} [userId]
 */
export async function updateFormDefinition(id, body, userId) {
  const doc = await FormDefinition.findById(id);
  if (!doc) return { ok: false, errors: ['Form not found'] };
  const payload = normalizeFormPayload(body);
  if (payload.slug && payload.slug !== doc.slug) {
    const clash = await FormDefinition.findOne({ slug: payload.slug, _id: { $ne: id } });
    if (clash) return { ok: false, errors: ['Slug already in use'] };
  }
  const merged = {
    name: payload.name ?? doc.name,
    slug: payload.slug ?? doc.slug,
    description: payload.description ?? doc.description,
    category: payload.category ?? doc.category,
    status: payload.status ?? doc.status,
    fields: payload.fields ?? doc.fields,
    settings: payload.settings ?? doc.settings,
    notifications: payload.notifications ?? doc.notifications,
    successMessage: payload.successMessage ?? doc.successMessage,
    redirectUrl: payload.redirectUrl ?? doc.redirectUrl,
    spamSettings: payload.spamSettings ?? doc.spamSettings,
  };
  const errors = validateFormDefinition(merged);
  if (errors.length) return { ok: false, errors };
  if (JSON.stringify(doc.fields) !== JSON.stringify(merged.fields)) {
    doc.version = (doc.version || 1) + 1;
  }
  Object.assign(doc, merged, { updatedBy: userId });
  await doc.save();
  return { ok: true, form: doc.toObject() };
}

/**
 * @param {string} id
 */
export async function deleteFormDefinition(id) {
  const doc = await FormDefinition.findByIdAndDelete(id);
  return Boolean(doc);
}

/**
 * @param {string} id
 */
export async function duplicateFormDefinition(id, userId) {
  const source = await FormDefinition.findById(id).lean();
  if (!source) return null;
  const baseSlug = `${source.slug}-copy`;
  let slug = baseSlug;
  let n = 1;
  while (await FormDefinition.findOne({ slug })) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }
  const { _id, createdAt, updatedAt, ...rest } = source;
  const doc = await FormDefinition.create({
    ...rest,
    name: `${source.name} (Copy)`,
    slug,
    status: 'draft',
    version: 1,
    updatedBy: userId,
  });
  return doc.toObject();
}

/**
 * @param {object} body
 */
function normalizeFormPayload(body) {
  return {
    name: String(body.name || '').trim(),
    slug: String(body.slug || '').trim().toLowerCase(),
    description: String(body.description || '').trim(),
    category: String(body.category || 'general').trim(),
    status: body.status === 'published' ? 'published' : 'draft',
    fields: Array.isArray(body.fields) ? body.fields : [],
    settings: body.settings || {},
    notifications: body.notifications || {},
    successMessage: String(body.successMessage || '').trim() || 'Thank you! Your submission has been received.',
    redirectUrl: String(body.redirectUrl || '').trim(),
    spamSettings: body.spamSettings || {},
  };
}

export function hashIp(ip) {
  if (!ip) return undefined;
  return crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 32);
}
