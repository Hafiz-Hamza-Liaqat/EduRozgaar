/**
 * Apply workflow publish/archive to underlying content models (admin-only).
 */
import { Blog } from '../../models/Blog.js';
import { Job } from '../../models/Job.js';
import { Scholarship } from '../../models/Scholarship.js';
import { Admission } from '../../models/Admission.js';
import { CareerArticle } from '../../models/CareerArticle.js';
import { Institution } from '../../models/Institution.js';
import { FormDefinition } from '../../models/FormDefinition.js';
import { CmsPageLayout } from '../../models/CmsPageLayout.js';
import { CmsStaticPage } from '../../models/CmsStaticPage.js';
import { MediaAsset } from '../../models/MediaAsset.js';

const MODEL_MAP = {
  blogs: Blog,
  jobs: Job,
  scholarships: Scholarship,
  admissions: Admission,
  'career-guidance': CareerArticle,
  universities: Institution,
  forms: FormDefinition,
  'page-builder': CmsPageLayout,
  'cms-page': CmsStaticPage,
  media: MediaAsset,
};

/**
 * @param {string} entityType
 * @param {string} entityId
 * @param {'published'|'archived'|'draft'} targetStatus
 */
export async function syncEntityPublishState(entityType, entityId, targetStatus) {
  const Model = MODEL_MAP[entityType];
  if (!Model) return { synced: false, reason: 'no_model' };

  const doc = await Model.findById(entityId);
  if (!doc) return { synced: false, reason: 'not_found' };

  if (entityType === 'jobs') {
    if (targetStatus === 'published') {
      doc.approvalStatus = 'approved';
      doc.status = doc.status || 'active';
    } else if (targetStatus === 'archived') {
      doc.status = 'closed';
    }
    await doc.save();
    return { synced: true };
  }

  if (entityType === 'media') {
    if (targetStatus === 'published' && doc.metadata) {
      doc.metadata.workflowPublished = true;
    }
    await doc.save();
    return { synced: true };
  }

  if (doc.status !== undefined) {
    const statusMap = {
      published: 'published',
      archived: 'archived',
      draft: 'draft',
    };
    doc.status = statusMap[targetStatus] || doc.status;
    if (targetStatus === 'published' && doc.publishedAt !== undefined && !doc.publishedAt) {
      doc.publishedAt = new Date();
    }
    await doc.save();
    return { synced: true };
  }

  return { synced: false, reason: 'no_status_field' };
}

/**
 * Derive initial workflow status from entity document.
 */
export async function inferWorkflowStatusFromEntity(entityType, entityId) {
  const Model = MODEL_MAP[entityType];
  if (!Model) return 'draft';
  const doc = await Model.findById(entityId).lean();
  if (!doc) return 'draft';

  if (entityType === 'jobs') {
    if (doc.approvalStatus === 'pending') return 'in_review';
    if (doc.approvalStatus === 'rejected') return 'changes_requested';
    if (doc.status === 'closed') return 'archived';
    return 'published';
  }

  if (doc.status === 'published') return 'published';
  if (doc.status === 'archived') return 'archived';
  if (doc.scheduledAt && new Date(doc.scheduledAt) > new Date()) return 'scheduled';
  return 'draft';
}

/**
 * @param {string} entityType
 * @param {string} entityId
 */
export async function fetchEntityTitle(entityType, entityId) {
  const Model = MODEL_MAP[entityType];
  if (!Model) return '';
  const doc = await Model.findById(entityId).select('title name slug headline').lean();
  if (!doc) return '';
  return doc.title || doc.name || doc.headline || doc.slug || '';
}
