/**
 * Workflow integration hooks — call from admin write paths (C.7.0.6).
 * Additive; does not alter public runtime.
 */
import { getOrCreateWorkflow } from './WorkflowService.js';
import { inferWorkflowStatusFromEntity, fetchEntityTitle } from './workflowEntitySync.js';

/**
 * Ensure an EditorialWorkflow overlay exists after content create/update.
 */
export async function ensureEditorialWorkflow(entityType, entityId, options = {}) {
  if (!entityType || !entityId) return null;
  const title = options.title || (await fetchEntityTitle(entityType, String(entityId)));
  const status = options.status || (await inferWorkflowStatusFromEntity(entityType, String(entityId)));
  return getOrCreateWorkflow(entityType, String(entityId), { title, status });
}

export async function syncWorkflowAfterSave(entityType, doc) {
  if (!doc?._id) return null;
  const title = doc.title || doc.name || doc.headline || doc.slug || '';
  const locale = doc.locale || 'en';
  return ensureEditorialWorkflow(entityType, doc._id, { title, locale });
}

/** Map admin resource keys to workflow entity types. */
export const ADMIN_RESOURCE_WORKFLOW_MAP = {
  jobs: 'jobs',
  scholarships: 'scholarships',
  admissions: 'admissions',
  blogs: 'blogs',
  career: 'career-guidance',
  universities: 'universities',
  forms: 'forms',
  media: 'media',
  'page-layout': 'page-builder',
  'cms-page': 'cms-page',
};
