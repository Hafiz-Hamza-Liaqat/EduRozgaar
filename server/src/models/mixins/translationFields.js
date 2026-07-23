/**
 * Reusable translation fields for translatable content models (C.7.0.8).
 */
import mongoose from 'mongoose';
import { DEFAULT_LOCALE, TRANSLATION_STATUSES } from '../../../../shared/localization/localeConfig.js';

export const translationFieldDefinition = {
  locale: { type: String, default: DEFAULT_LOCALE, index: true },
  translationGroupId: { type: String, index: true },
  translationOf: { type: mongoose.Schema.Types.ObjectId, default: null },
  translationStatus: {
    type: String,
    enum: TRANSLATION_STATUSES,
    default: 'published',
    index: true,
  },
};

/**
 * Apply compound unique slug+locale index (call after schema definition).
 * @param {import('mongoose').Schema} schema
 * @param {string} [slugField]
 */
export function applySlugLocaleIndex(schema, slugField = 'slug') {
  schema.index({ [slugField]: 1, locale: 1 }, { unique: true });
  schema.index({ translationGroupId: 1, locale: 1 });
}

/**
 * Ensure translation group id exists on save.
 */
export function ensureTranslationGroupHook(schema) {
  schema.pre('save', function ensureGroup(next) {
    if (!this.translationGroupId) {
      this.translationGroupId = this._id ? String(this._id) : new mongoose.Types.ObjectId().toString();
    }
    if (!this.locale) this.locale = DEFAULT_LOCALE;
    next();
  });
}
