/**
 * Locale-aware MongoDB query helpers for public APIs (C.7.0.8).
 */
import mongoose from 'mongoose';
import { resolveLocaleFromRequest, resolveContentLocale } from '../../../shared/localization/localeResolver.js';
import { mongoLocaleFilter } from '../../../shared/localization/localeFallback.js';
import { DEFAULT_LOCALE } from '../../../shared/localization/localeConfig.js';

export function getRequestLocale(req) {
  return resolveLocaleFromRequest(req);
}

/** Merge locale filter into a list query without clobbering existing $or. */
export function withListLocaleFilter(baseFilter, locale) {
  const localePart = mongoLocaleFilter(resolveContentLocale(locale));
  return { $and: [baseFilter, localePart] };
}

function localizedFindFilter(baseFilter, locale, extra = {}) {
  return { $and: [baseFilter, mongoLocaleFilter(resolveContentLocale(locale)), extra] };
}

export async function findLocalizedBySlug(Model, slug, baseFilter, locale) {
  const loc = resolveContentLocale(locale);
  let doc = await Model.findOne(localizedFindFilter(baseFilter, loc, { slug })).lean();
  if (!doc && loc !== DEFAULT_LOCALE) {
    doc = await Model.findOne(localizedFindFilter(baseFilter, DEFAULT_LOCALE, { slug })).lean();
  }
  return doc;
}

export async function findLocalizedById(Model, id, baseFilter, locale) {
  const loc = resolveContentLocale(locale);
  let doc = await Model.findOne(localizedFindFilter(baseFilter, loc, { _id: id })).lean();
  if (!doc && loc !== DEFAULT_LOCALE) {
    doc = await Model.findOne(localizedFindFilter(baseFilter, DEFAULT_LOCALE, { _id: id })).lean();
  }
  return doc;
}

export function isObjectIdParam(value) {
  return mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === value;
}
