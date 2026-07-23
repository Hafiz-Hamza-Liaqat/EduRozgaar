import {
  slugify,
  jobSlug,
  scholarshipSlug,
  admissionSlug,
  blogSlug,
  foreignStudySlug,
  companySlug,
} from '../utils/slugify.js';
import { isReservedSlug } from '../config/reservedSlugs.js';
import { Job } from '../models/Job.js';
import { Scholarship } from '../models/Scholarship.js';
import { Admission } from '../models/Admission.js';
import { Blog } from '../models/Blog.js';
import { Company } from '../models/Company.js';
import { Institution } from '../models/Institution.js';
import { Webinar } from '../models/Webinar.js';
import { CmsStaticPage } from '../models/CmsStaticPage.js';
import { ForeignStudy } from '../models/ForeignStudy.js';
import { Internship } from '../models/Internship.js';
import { University } from '../models/University.js';
import { CareerArticle } from '../models/CareerArticle.js';
import { IntlScholarship } from '../models/IntlScholarship.js';
import { mongoLocaleFilter } from '../../../shared/localization/localeFallback.js';
import { buildLocalizedSlugUrl, localePathPrefix } from '../../../shared/localization/localeUtils.js';
import { normalizeLocale } from '../../../shared/localization/localeResolver.js';

const MAX_SLUG_LENGTH = 120;
const SITE_BASE = (process.env.SITE_URL || process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');

/** @typedef {'job'|'scholarship'|'admission'|'blog'|'company'|'institution'|'webinar'|'cms-page'|'foreign-study'|'internship'|'university'|'career-article'|'intl-scholarship'} SlugResourceType */

export const SLUG_RESOURCE_TYPES = [
  'job',
  'scholarship',
  'admission',
  'blog',
  'company',
  'institution',
  'webinar',
  'cms-page',
  'foreign-study',
  'internship',
  'university',
  'career-article',
  'intl-scholarship',
];

/** Slug uniqueness scoped per locale (English includes legacy records without locale). */
export function localeSlugCompoundFilter(slug, locale) {
  return { slug, ...mongoLocaleFilter(normalizeLocale(locale)) };
}

const LOCALE_SLUG_RESOURCES = new Set([
  'job', 'scholarship', 'admission', 'blog', 'university', 'career-article', 'cms-page',
]);

export const SLUG_RESOURCE_CONFIG = {
  job: {
    model: Job,
    path: '/jobs',
    draftStatuses: ['draft'],
    compoundFilter: localeSlugCompoundFilter,
    generate: (fields) => jobSlug(fields.title, fields.province || fields.location || ''),
  },
  scholarship: {
    model: Scholarship,
    path: '/scholarships',
    draftStatuses: ['draft'],
    compoundFilter: localeSlugCompoundFilter,
    generate: (fields) => scholarshipSlug(fields.title, fields.country || ''),
  },
  admission: {
    model: Admission,
    path: '/admissions',
    draftStatuses: ['draft'],
    compoundFilter: localeSlugCompoundFilter,
    generate: (fields) => admissionSlug(fields.program, fields.institution || ''),
  },
  blog: {
    model: Blog,
    path: '/blog',
    draftStatuses: ['draft'],
    compoundFilter: localeSlugCompoundFilter,
    generate: (fields) => blogSlug(fields.title || ''),
  },
  company: {
    model: Company,
    path: '/company',
    draftStatuses: ['draft'],
    generate: (fields) => companySlug(fields.name || ''),
  },
  institution: {
    model: Institution,
    path: '/schools-and-colleges',
    draftStatuses: ['draft'],
    generate: (fields) => slugify(fields.name || ''),
  },
  webinar: {
    model: Webinar,
    path: '/webinars',
    draftStatuses: ['draft'],
    generate: (fields) => slugify(fields.title || ''),
  },
  'cms-page': {
    model: CmsStaticPage,
    path: '/',
    draftStatuses: ['draft'],
    compoundFilter: (slug, locale) => ({ slug, locale: locale || 'en' }),
    generate: (fields) => blogSlug(fields.title || fields.slug || ''),
  },
  'foreign-study': {
    model: ForeignStudy,
    path: '/foreign-studies',
    draftStatuses: ['draft'],
    generate: (fields) => foreignStudySlug(fields.country, fields.program || ''),
  },
  internship: {
    model: Internship,
    path: '/internships',
    draftStatuses: ['draft'],
    generate: (fields) => {
      const base = slugify(fields.title || '');
      const suffix = fields._id ? String(fields._id).slice(-6) : Date.now().toString(36);
      return base ? `${base}-${suffix}` : suffix;
    },
  },
  university: {
    model: University,
    path: '/university',
    draftStatuses: ['draft'],
    compoundFilter: localeSlugCompoundFilter,
    generate: (fields) => companySlug(fields.name || ''),
  },
  'career-article': {
    model: CareerArticle,
    path: '/career-guidance',
    draftStatuses: ['draft'],
    compoundFilter: localeSlugCompoundFilter,
    generate: (fields) => blogSlug(fields.title || ''),
  },
  'intl-scholarship': {
    model: IntlScholarship,
    path: '/intl-scholarships',
    draftStatuses: ['draft'],
    generate: (fields) => scholarshipSlug(fields.title || '', fields.country || ''),
  },
};

export function normalizeSlug(text) {
  const raw = slugify(text || '');
  if (!raw) return '';
  return raw.length > MAX_SLUG_LENGTH ? raw.slice(0, MAX_SLUG_LENGTH).replace(/-+$/, '') : raw;
}

export function validateSlug(slug) {
  const normalized = normalizeSlug(slug);
  if (!normalized) {
    return { valid: false, normalized: '', message: 'Slug contains invalid characters.' };
  }
  if (isReservedSlug(normalized)) {
    return { valid: false, normalized, message: 'This slug is reserved.', reserved: true };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    return { valid: false, normalized, message: 'Slug contains invalid characters.' };
  }
  return { valid: true, normalized, message: null, reserved: false };
}

export function isSlugLocked(status, draftStatuses = ['draft']) {
  return status != null && !draftStatuses.includes(status);
}

export function generateSlugForResource(resourceType, fields = {}) {
  const config = SLUG_RESOURCE_CONFIG[resourceType];
  if (!config) return '';
  return normalizeSlug(config.generate(fields));
}

export async function ensureSlugUnique(Model, baseSlug, options = {}) {
  const { excludeId, locale, compoundFilter } = options;
  const normalized = normalizeSlug(baseSlug);
  if (!normalized) return { slug: '', available: false };

  const buildFilter = (slug) => {
    if (compoundFilter) return compoundFilter(slug, locale);
    const filter = { slug };
    if (excludeId) filter._id = { $ne: excludeId };
    return filter;
  };

  let candidate = normalized;
  if (!(await Model.findOne(buildFilter(candidate)))) {
    return { slug: candidate, available: true };
  }

  let i = 1;
  while (i < 1000) {
    candidate = `${normalized}-${i}`;
    if (candidate.length > MAX_SLUG_LENGTH) {
      candidate = `${normalized.slice(0, MAX_SLUG_LENGTH - String(i).length - 1)}-${i}`;
    }
    if (!(await Model.findOne(buildFilter(candidate)))) {
      return { slug: candidate, available: true };
    }
    i += 1;
  }
  return { slug: candidate, available: false };
}

export function previewUrl(resourceType, slug, options = {}) {
  const config = SLUG_RESOURCE_CONFIG[resourceType];
  if (!config || !slug) return '';
  const locale = normalizeLocale(options.locale);
  if (resourceType === 'cms-page') {
    return `${SITE_BASE}${localePathPrefix(locale)}/${slug}`;
  }
  if (LOCALE_SLUG_RESOURCES.has(resourceType)) {
    return `${SITE_BASE}${buildLocalizedSlugUrl(config.path, slug, locale)}`;
  }
  return `${SITE_BASE}${config.path}/${slug}`;
}

/**
 * Resolve slug for admin create/update.
 * @returns {{ slug: string } | { error: string, status: number }}
 */
export async function resolveSlugForSave({
  resourceType,
  doc,
  body = {},
  isCreate = false,
}) {
  const config = SLUG_RESOURCE_CONFIG[resourceType];
  if (!config) return { error: 'Unknown slug resource type.', status: 400 };

  const merged = {
    ...(doc?.toObject ? doc.toObject() : doc || {}),
    ...body,
  };
  const status = body.status !== undefined ? body.status : (doc?.status ?? 'draft');
  const currentSlug = doc?.slug;
  const locked = !isCreate && currentSlug && isSlugLocked(status, config.draftStatuses);
  const explicitSlug = body.slug !== undefined;

  let candidate;
  if (explicitSlug) {
    candidate = normalizeSlug(body.slug);
  } else if (locked) {
    candidate = currentSlug;
  } else {
    candidate = generateSlugForResource(resourceType, merged);
  }

  const validation = validateSlug(candidate);
  if (!validation.valid) {
    return { error: validation.message, status: 400 };
  }
  candidate = validation.normalized;

  const unique = await ensureSlugUnique(config.model, candidate, {
    excludeId: doc?._id,
    locale: merged.locale || doc?.locale,
    compoundFilter: config.compoundFilter,
  });

  if (!unique.available && unique.slug === candidate) {
    return { error: 'This slug is already in use.', status: 400 };
  }

  return { slug: unique.slug };
}

export async function checkSlugAvailability({
  resourceType,
  slug,
  excludeId,
  locale,
}) {
  const config = SLUG_RESOURCE_CONFIG[resourceType];
  if (!config) {
    return { valid: false, available: false, message: 'Unknown resource type.' };
  }

  const validation = validateSlug(slug);
  if (!validation.valid) {
    return {
      slug: validation.normalized,
      valid: false,
      available: false,
      reserved: !!validation.reserved,
      message: validation.message,
      previewUrl: '',
    };
  }

  const filter = config.compoundFilter
    ? config.compoundFilter(validation.normalized, locale)
    : { slug: validation.normalized };
  if (excludeId) filter._id = { $ne: excludeId };

  const existing = await config.model.findOne(filter).select('_id').lean();
  const available = !existing;

  return {
    slug: validation.normalized,
    valid: true,
    available,
    reserved: false,
    message: available ? null : 'This slug is already in use.',
    previewUrl: previewUrl(resourceType, validation.normalized, { locale }),
  };
}

/** Delegate for bulkUpsert compatibility */
export async function ensureSlugUniqueLegacy(Model, baseSlug, _field = 'slug') {
  const result = await ensureSlugUnique(Model, baseSlug);
  return result.slug;
}
