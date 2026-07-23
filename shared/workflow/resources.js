/**
 * Workflow-enabled content resources (C.7.0.6).
 */

export const WORKFLOW_RESOURCES = [
  'page-builder',
  'blogs',
  'jobs',
  'scholarships',
  'admissions',
  'career-guidance',
  'universities',
  'forms',
  'media',
  'cms-page',
];

export const WORKFLOW_RESOURCE_SET = new Set(WORKFLOW_RESOURCES);

export const WORKFLOW_ACTIONS = [
  'view',
  'create',
  'edit',
  'review',
  'approve',
  'publish',
  'schedule',
  'delete',
  'restore',
  'manage',
];

/**
 * @param {string} resource
 */
export function isWorkflowResource(resource) {
  return WORKFLOW_RESOURCE_SET.has(resource);
}

/**
 * @param {string} resource
 */
export function workflowResourceLabel(resource) {
  const labels = {
    'page-builder': 'Page Builder',
    blogs: 'Blogs',
    jobs: 'Jobs',
    scholarships: 'Scholarships',
    admissions: 'Admissions',
    'career-guidance': 'Career Guidance',
    universities: 'Universities',
    forms: 'Forms',
    media: 'Media',
    'cms-page': 'CMS Pages',
  };
  return labels[resource] || resource;
}
