/**
 * Form presentation localization (C.7.0.8).
 * Resolves labels/messages without duplicating form definitions.
 */
import { normalizeLocale } from './localization/localeResolver.js';
import { resolveTranslatedField } from './localization/localeFallback.js';

/**
 * Merge base form definition with locale-specific presentation strings.
 * @param {object} form - FormDefinition document
 * @param {string} [locale]
 */
export function resolveLocalizedFormDefinition(form, locale) {
  if (!form) return null;
  const loc = normalizeLocale(locale);
  const tr = form.translations?.[loc] || {};

  const fields = (form.fields || []).map((field) => {
    const fieldTr = tr.fields?.[field.id] || tr.fields?.[field.name] || {};
    return {
      ...field,
      label: fieldTr.label || field.label,
      placeholder: fieldTr.placeholder || field.placeholder,
      helpText: fieldTr.helpText || field.helpText,
      options: (field.options || []).map((opt, i) => ({
        ...opt,
        label: fieldTr.options?.[i]?.label || fieldTr.options?.[opt.value]?.label || opt.label,
      })),
    };
  });

  return {
    ...form,
    locale: loc,
    name: tr.name || form.name,
    description: tr.description || form.description,
    fields,
    settings: {
      ...form.settings,
      submitLabel: tr.submitLabel || form.settings?.submitLabel,
    },
    successMessage: tr.successMessage || form.successMessage,
    notifications: {
      ...form.notifications,
      adminSubject: tr.adminSubject || form.notifications?.adminSubject,
      userSubject: tr.userSubject || form.notifications?.userSubject,
    },
  };
}

/**
 * Localized validation error messages.
 */
export function resolveFormValidationMessage(form, locale, key, fallback) {
  const loc = normalizeLocale(locale);
  const messages = form?.translations?.[loc]?.validation || {};
  return resolveTranslatedField(messages, loc) || messages[key] || fallback;
}
