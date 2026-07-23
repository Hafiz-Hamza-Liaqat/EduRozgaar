import { CmsPageLayout } from '../models/CmsPageLayout.js';
import { CmsGlobalBlock } from '../models/CmsGlobalBlock.js';
import { CmsHomepage } from '../models/CmsHomepage.js';
import { CmsStaticPage } from '../models/CmsStaticPage.js';
import { CmsBanner } from '../models/CmsBanner.js';
import { CmsNavigation } from '../models/CmsNavigation.js';
import { Blog } from '../models/Blog.js';
import { AdSlotConfig } from '../models/AdSlotConfig.js';
import { Job } from '../models/Job.js';
import { Scholarship } from '../models/Scholarship.js';
import { University } from '../models/University.js';
import { Company } from '../models/Company.js';
import { CareerArticle } from '../models/CareerArticle.js';

/**
 * Collect all public URLs for an asset (for reference matching).
 * @param {object} asset
 */
export function collectAssetReferenceUrls(asset) {
  const urls = new Set();
  const add = (u) => { if (u && typeof u === 'string') urls.add(u.trim()); };
  add(asset.storageUrl);
  add(asset.thumbnailUrl);
  add(asset.mediumUrl);
  add(asset.largeUrl);
  if (asset.variants) {
    for (const u of Object.values(asset.variants)) add(u);
  }
  return [...urls];
}

/**
 * @param {string} haystack
 * @param {string[]} urls
 */
function containsAnyUrl(haystack, urls) {
  if (!haystack || !urls.length) return false;
  const str = typeof haystack === 'string' ? haystack : JSON.stringify(haystack);
  return urls.some((u) => u && str.includes(u));
}

/**
 * @param {object} asset
 * @returns {Promise<{ type: string; label: string; ref: string; detail?: string }[]>}
 */
export async function findMediaAssetUsage(asset) {
  const urls = collectAssetReferenceUrls(asset);
  if (!urls.length) return [];

  /** @type {{ type: string; label: string; ref: string; detail?: string }[]} */
  const usage = [];

  const layouts = await CmsPageLayout.find({})
    .select('pageKey locale title draftBlocks publishedBlocks ogImageUrl')
    .lean();
  for (const doc of layouts) {
    const inDraft = containsAnyUrl(doc.draftBlocks, urls) || urls.includes(doc.ogImageUrl);
    const inPublished = containsAnyUrl(doc.publishedBlocks, urls) || urls.includes(doc.ogImageUrl);
    if (inDraft || inPublished) {
      usage.push({
        type: 'page-layout',
        label: doc.title || doc.pageKey,
        ref: `${doc.pageKey}/${doc.locale}`,
        detail: inDraft && inPublished ? 'draft & published' : inDraft ? 'draft' : 'published',
      });
    }
  }

  const globalBlocks = await CmsGlobalBlock.find({}).select('name blockType config').lean();
  for (const doc of globalBlocks) {
    if (containsAnyUrl(doc.config, urls)) {
      usage.push({ type: 'global-block', label: doc.name, ref: String(doc._id), detail: doc.blockType });
    }
  }

  const homepages = await CmsHomepage.find({}).select('locale hero ogImageUrl sections').lean();
  for (const doc of homepages) {
    if (containsAnyUrl(doc, urls)) {
      usage.push({ type: 'homepage', label: `Homepage (${doc.locale || 'en'})`, ref: doc.locale || 'en' });
    }
  }

  const cmsPages = await CmsStaticPage.find({}).select('title slug ogImageUrl content').lean();
  for (const doc of cmsPages) {
    if (containsAnyUrl(doc, urls)) {
      usage.push({ type: 'cms-page', label: doc.title || doc.slug, ref: doc.slug || String(doc._id) });
    }
  }

  const banners = await CmsBanner.find({}).select('title ogImageUrl imageUrl').lean();
  for (const doc of banners) {
    if (containsAnyUrl(doc, urls)) {
      usage.push({ type: 'banner', label: doc.title || 'Banner', ref: String(doc._id) });
    }
  }

  const navs = await CmsNavigation.find({}).select('placement locale items').lean();
  for (const doc of navs) {
    if (containsAnyUrl(doc.items, urls)) {
      usage.push({ type: 'navigation', label: `Nav ${doc.placement}`, ref: `${doc.placement}/${doc.locale}` });
    }
  }

  const blogs = await Blog.find({}).select('title slug imageUrl ogImageUrl').lean();
  for (const doc of blogs) {
    if (urls.includes(doc.imageUrl) || urls.includes(doc.ogImageUrl)) {
      usage.push({ type: 'blog', label: doc.title, ref: doc.slug || String(doc._id) });
    }
  }

  const ads = await AdSlotConfig.find({}).select('name placement imageUrl').lean();
  for (const doc of ads) {
    if (urls.includes(doc.imageUrl)) {
      usage.push({ type: 'advertisement', label: doc.name || doc.placement, ref: String(doc._id) });
    }
  }

  const jobs = await Job.find({ imageUrl: { $in: urls } }).select('title slug').limit(20).lean();
  for (const doc of jobs) {
    usage.push({ type: 'job', label: doc.title, ref: doc.slug || String(doc._id) });
  }

  const scholarships = await Scholarship.find({ logoUrl: { $in: urls } }).select('title slug').limit(20).lean();
  for (const doc of scholarships) {
    usage.push({ type: 'scholarship', label: doc.title, ref: doc.slug || String(doc._id) });
  }

  const universities = await University.find({
    $or: [{ logoUrl: { $in: urls } }, { bannerUrl: { $in: urls } }],
  }).select('name slug').limit(20).lean();
  for (const doc of universities) {
    usage.push({ type: 'university', label: doc.name, ref: doc.slug || String(doc._id) });
  }

  const companies = await Company.find({
    $or: [{ logoUrl: { $in: urls } }, { bannerUrl: { $in: urls } }],
  }).select('name slug').limit(20).lean();
  for (const doc of companies) {
    usage.push({ type: 'company', label: doc.name, ref: doc.slug || String(doc._id) });
  }

  const articles = await CareerArticle.find({ imageUrl: { $in: urls } }).select('title slug').limit(20).lean();
  for (const doc of articles) {
    usage.push({ type: 'career-article', label: doc.title, ref: doc.slug || String(doc._id) });
  }

  return usage;
}
