import mongoose from 'mongoose';
import { translationFieldDefinition, ensureTranslationGroupHook } from './mixins/translationFields.js';

const fieldOptionSchema = new mongoose.Schema(
  { value: String, label: String },
  { _id: false },
);

const formFieldSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    label: { type: String, default: '' },
    name: { type: String, required: true },
    required: { type: Boolean, default: false },
    placeholder: { type: String, default: '' },
    helpText: { type: String, default: '' },
    defaultValue: { type: mongoose.Schema.Types.Mixed, default: '' },
    validation: { type: mongoose.Schema.Types.Mixed, default: {} },
    options: { type: [fieldOptionSchema], default: [] },
    conditional: { type: mongoose.Schema.Types.Mixed, default: null },
    collapsed: { type: Boolean, default: false },
  },
  { _id: false },
);

const formDefinitionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: '', trim: true },
    category: { type: String, default: 'general', trim: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    version: { type: Number, default: 1 },
    fields: { type: [formFieldSchema], default: [] },
    settings: {
      submitLabel: { type: String, default: 'Submit' },
      layout: { type: String, default: 'stacked' },
    },
    notifications: {
      adminEmail: { type: String, default: '' },
      sendAdminEmail: { type: Boolean, default: true },
      sendUserConfirmation: { type: Boolean, default: false },
      adminSubject: { type: String, default: 'New form submission' },
      userSubject: { type: String, default: 'We received your submission' },
    },
    successMessage: { type: String, default: 'Thank you! Your submission has been received.' },
    redirectUrl: { type: String, default: '' },
    spamSettings: {
      honeypot: { type: Boolean, default: true },
      honeypotField: { type: String, default: 'website' },
      rateLimitPerHour: { type: Number, default: 10 },
      captchaProvider: { type: String, enum: ['none', 'recaptcha', 'turnstile'], default: 'none' },
      captchaSiteKey: { type: String, default: '' },
      throttleSeconds: { type: Number, default: 0 },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    /** Per-locale presentation strings (labels, messages) — C.7.0.8 */
    translations: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ...translationFieldDefinition,
  },
  { timestamps: true },
);

formDefinitionSchema.index({ slug: 1, locale: 1 }, { unique: true });
formDefinitionSchema.index({ translationGroupId: 1, locale: 1 });
formDefinitionSchema.index({ status: 1, updatedAt: -1 });
formDefinitionSchema.index({ category: 1 });
ensureTranslationGroupHook(formDefinitionSchema);

export const FormDefinition = mongoose.model('FormDefinition', formDefinitionSchema);
