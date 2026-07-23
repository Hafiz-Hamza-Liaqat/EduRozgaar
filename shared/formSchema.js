/**
 * Forms Builder — shared schema & validation (C.7.0.2).
 */

export const FORM_FIELD_TYPES = [
  'text',
  'textarea',
  'email',
  'phone',
  'number',
  'date',
  'select',
  'radio',
  'checkbox',
  'multi-checkbox',
  'file',
  'url',
  'hidden',
  'divider',
  'heading',
  'richtext',
  'consent',
];

export const FORM_STATUSES = ['draft', 'published'];

export const FORM_CATEGORIES = [
  'general',
  'contact',
  'newsletter',
  'application',
  'survey',
  'support',
];

export const LAYOUT_FIELD_TYPES = new Set(['divider', 'heading', 'richtext', 'hidden']);

export const INPUT_FIELD_TYPES = FORM_FIELD_TYPES.filter((t) => !LAYOUT_FIELD_TYPES.has(t));

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/.+/i;
const PHONE_REGEX = /^[+]?[\d\s().-]{7,20}$/;

/**
 * @param {number} [len]
 */
export function createFieldId(len = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return `fld_${out}`;
}

/**
 * @param {string} type
 * @param {Record<string, unknown>} [overrides]
 */
export function createFormField(type, overrides = {}) {
  const id = createFieldId();
  const base = {
    id,
    type,
    label: '',
    name: `field_${id}`,
    required: false,
    placeholder: '',
    helpText: '',
    defaultValue: '',
    validation: {},
    options: [],
    conditional: null,
    collapsed: false,
  };
  if (type === 'heading') {
    base.label = 'Section heading';
    base.name = `heading_${id}`;
  }
  if (type === 'divider') {
    base.name = `divider_${id}`;
    base.label = '';
  }
  if (type === 'consent') {
    base.label = 'I agree to the terms';
    base.required = true;
  }
  if (['select', 'radio', 'multi-checkbox'].includes(type)) {
    base.options = [
      { value: 'option_1', label: 'Option 1' },
      { value: 'option_2', label: 'Option 2' },
    ];
  }
  return { ...base, ...overrides, id: overrides.id || base.id, type };
}

/**
 * @param {Record<string, unknown>} [overrides]
 */
export function createEmptyFormDefinition(overrides = {}) {
  return {
    name: 'Untitled Form',
    slug: '',
    description: '',
    category: 'general',
    status: 'draft',
    version: 1,
    fields: [],
    settings: {
      submitLabel: 'Submit',
      layout: 'stacked',
    },
    notifications: {
      adminEmail: '',
      sendAdminEmail: true,
      sendUserConfirmation: false,
      adminSubject: 'New form submission',
      userSubject: 'We received your submission',
    },
    successMessage: 'Thank you! Your submission has been received.',
    redirectUrl: '',
    spamSettings: {
      honeypot: true,
      honeypotField: 'website',
      rateLimitPerHour: 10,
      captchaProvider: 'none',
      throttleSeconds: 0,
    },
    ...overrides,
  };
}

/**
 * @param {string} label
 */
export function slugifyFormName(label) {
  return String(label || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * @param {unknown} field
 */
export function isInputField(field) {
  return field && typeof field === 'object' && INPUT_FIELD_TYPES.includes(field.type);
}

/**
 * @param {unknown[]} fields
 */
export function getInputFields(fields) {
  return (fields || []).filter(isInputField);
}

/**
 * @param {unknown} definition
 * @returns {string[]}
 */
export function validateFormDefinition(definition) {
  const errors = [];
  if (!definition || typeof definition !== 'object') return ['Form definition is required'];
  if (!String(definition.name || '').trim()) errors.push('Form name is required');
  if (!String(definition.slug || '').trim()) errors.push('Form slug is required');
  if (!FORM_STATUSES.includes(definition.status)) errors.push('Invalid form status');
  const fields = Array.isArray(definition.fields) ? definition.fields : [];
  const names = new Set();
  for (const field of fields) {
    if (!field?.type || !FORM_FIELD_TYPES.includes(field.type)) {
      errors.push(`Invalid field type: ${field?.type || 'unknown'}`);
      continue;
    }
    if (LAYOUT_FIELD_TYPES.has(field.type)) continue;
    const name = String(field.name || '').trim();
    if (!name) errors.push(`Field "${field.label || field.id}" is missing a name`);
    else if (names.has(name)) errors.push(`Duplicate field name: ${name}`);
    else names.add(name);
    if (!String(field.label || '').trim() && field.type !== 'hidden') {
      errors.push(`Field "${name}" is missing a label`);
    }
  }
  return errors;
}

/**
 * @param {unknown} field
 * @param {unknown} value
 * @param {unknown} [allValues]
 * @returns {string|null}
 */
export function validateFieldValue(field, value, allValues = {}) {
  if (!field || LAYOUT_FIELD_TYPES.has(field.type)) return null;
  const v = field.type === 'checkbox' ? Boolean(value) : value;
  const str = v == null ? '' : String(v).trim();
  const validation = field.validation || {};

  if (field.required) {
    if (field.type === 'checkbox' && !v) return `${field.label} is required`;
    if (field.type === 'multi-checkbox') {
      const arr = Array.isArray(value) ? value : [];
      if (!arr.length) return `${field.label} is required`;
    }
    if (field.type === 'consent' && !v) return 'You must accept to continue';
    if (field.type === 'file' && !value) return `${field.label} is required`;
    if (!['checkbox', 'multi-checkbox', 'consent', 'file'].includes(field.type) && !str) {
      return `${field.label} is required`;
    }
  }

  if (!str && field.type !== 'checkbox' && field.type !== 'multi-checkbox' && field.type !== 'file' && field.type !== 'consent') {
    return null;
  }

  if (field.type === 'email' && str && !EMAIL_REGEX.test(str)) return 'Enter a valid email address';
  if (field.type === 'url' && str && !URL_REGEX.test(str)) return 'Enter a valid URL (https://…)';
  if (field.type === 'phone' && str && !PHONE_REGEX.test(str)) return 'Enter a valid phone number';

  if (field.type === 'number' && str) {
    const num = Number(str);
    if (Number.isNaN(num)) return 'Enter a valid number';
    if (validation.min != null && num < Number(validation.min)) return `Minimum value is ${validation.min}`;
    if (validation.max != null && num > Number(validation.max)) return `Maximum value is ${validation.max}`;
  }

  if (['text', 'textarea'].includes(field.type) && str) {
    if (validation.minLength != null && str.length < Number(validation.minLength)) {
      return `Minimum ${validation.minLength} characters`;
    }
    if (validation.maxLength != null && str.length > Number(validation.maxLength)) {
      return `Maximum ${validation.maxLength} characters`;
    }
    if (validation.pattern) {
      try {
        const re = new RegExp(validation.pattern);
        if (!re.test(str)) return validation.patternMessage || 'Invalid format';
      } catch {
        // ignore bad regex in definition
      }
    }
  }

  if (field.type === 'select' || field.type === 'radio') {
    const allowed = (field.options || []).map((o) => o.value);
    if (str && allowed.length && !allowed.includes(str)) return 'Invalid selection';
  }

  if (field.type === 'multi-checkbox') {
    const arr = Array.isArray(value) ? value : [];
    const allowed = new Set((field.options || []).map((o) => o.value));
    if (arr.some((x) => !allowed.has(x))) return 'Invalid selection';
  }

  if (field.type === 'file' && value && typeof value === 'object') {
    const maxBytes = validation.maxSizeBytes || 10 * 1024 * 1024;
    if (value.size && value.size > maxBytes) return `File must be under ${Math.round(maxBytes / 1024 / 1024)}MB`;
    if (validation.allowedTypes?.length && value.mimeType) {
      if (!validation.allowedTypes.includes(value.mimeType)) return 'File type not allowed';
    }
  }

  return null;
}

/**
 * @param {unknown} definition
 * @param {Record<string, unknown>} values
 * @returns {{ ok: boolean; errors: Record<string, string> }}
 */
export function validateSubmission(definition, values) {
  const errors = {};
  const fields = getInputFields(definition?.fields || []);
  for (const field of fields) {
    const err = validateFieldValue(field, values[field.name], values);
    if (err) errors[field.name] = err;
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

/**
 * @param {unknown} definition — public-safe subset
 */
export function toPublicFormDefinition(definition) {
  if (!definition) return null;
  return {
    id: definition._id || definition.id,
    name: definition.name,
    slug: definition.slug,
    description: definition.description,
    category: definition.category,
    version: definition.version,
    fields: (definition.fields || []).map((f) => ({
      id: f.id,
      type: f.type,
      label: f.label,
      name: f.name,
      required: f.required,
      placeholder: f.placeholder,
      helpText: f.helpText,
      defaultValue: f.defaultValue,
      options: f.options,
      validation: f.validation,
    })),
    settings: definition.settings,
    successMessage: definition.successMessage,
    redirectUrl: definition.redirectUrl,
    spamSettings: {
      honeypot: Boolean(definition.spamSettings?.honeypot),
      honeypotField: definition.spamSettings?.honeypotField || 'website',
      captchaProvider: definition.spamSettings?.captchaProvider || 'none',
      captchaSiteKey: definition.spamSettings?.captchaSiteKey || '',
    },
  };
}
