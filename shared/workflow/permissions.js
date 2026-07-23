/**
 * Workflow permission matrix — maps resource + action → permission string (C.7.0.6).
 * Aligns with server/client PERMISSIONS in rbac.js.
 */

import { WORKFLOW_RESOURCES, WORKFLOW_ACTIONS } from './resources.js';

/** New workflow-specific permission strings (additive). */
export const WORKFLOW_PERMISSIONS = {
  WORKFLOW_VIEW: 'workflow:view',
  WORKFLOW_REVIEW: 'workflow:review',
  WORKFLOW_APPROVE: 'workflow:approve',
  WORKFLOW_PUBLISH: 'workflow:publish',
  WORKFLOW_SCHEDULE: 'workflow:schedule',
  WORKFLOW_MANAGE: 'workflow:manage',
};

/**
 * Resource → base content permission key (matches PERMISSIONS enum suffix).
 */
export const RESOURCE_CONTENT_PERM = {
  jobs: 'content:jobs',
  scholarships: 'content:scholarships',
  admissions: 'content:admissions',
  blogs: 'content:blogs',
  'career-guidance': 'content:career',
  universities: 'content:universities',
  forms: 'content:site',
  media: 'content:site',
  'page-builder': 'content:site',
  'cms-page': 'content:pages',
};

/**
 * Action → required workflow/content permission suffix logic.
 * @param {string} resource
 * @param {string} action
 * @returns {string[]} permission strings (any match grants access)
 */
export function resolveRequiredPermissions(resource, action) {
  const base = RESOURCE_CONTENT_PERM[resource];
  const perms = [];

  switch (action) {
    case 'view':
      perms.push(WORKFLOW_PERMISSIONS.WORKFLOW_VIEW, base);
      break;
    case 'create':
    case 'edit':
      if (base) perms.push(base);
      perms.push(WORKFLOW_PERMISSIONS.WORKFLOW_MANAGE);
      break;
    case 'review':
      perms.push(WORKFLOW_PERMISSIONS.WORKFLOW_REVIEW, WORKFLOW_PERMISSIONS.WORKFLOW_APPROVE);
      if (resource === 'jobs') perms.push('moderate:jobs');
      break;
    case 'approve':
      perms.push(WORKFLOW_PERMISSIONS.WORKFLOW_APPROVE);
      if (resource === 'jobs') perms.push('moderate:jobs');
      if (['page-builder', 'cms-page', 'blogs', 'forms'].includes(resource)) {
        perms.push('content:cms:publish');
      }
      break;
    case 'publish':
      perms.push(WORKFLOW_PERMISSIONS.WORKFLOW_PUBLISH, 'content:cms:publish');
      if (base) perms.push(base);
      break;
    case 'schedule':
      perms.push(WORKFLOW_PERMISSIONS.WORKFLOW_SCHEDULE, WORKFLOW_PERMISSIONS.WORKFLOW_PUBLISH);
      break;
    case 'delete':
      if (base) perms.push(base);
      perms.push(WORKFLOW_PERMISSIONS.WORKFLOW_MANAGE, 'users:manage');
      break;
    case 'restore':
      perms.push(WORKFLOW_PERMISSIONS.WORKFLOW_MANAGE);
      break;
    case 'manage':
      perms.push(WORKFLOW_PERMISSIONS.WORKFLOW_MANAGE, 'system:settings');
      break;
    default:
      break;
  }

  return [...new Set(perms.filter(Boolean))];
}

/**
 * @param {string[]} userPermissions - flat list from all roles
 * @param {string} resource
 * @param {string} action
 */
export function canPerformWorkflowAction(userPermissions, resource, action) {
  if (!userPermissions?.length) return false;
  const required = resolveRequiredPermissions(resource, action);
  if (!required.length) return false;
  return required.some((p) => userPermissions.includes(p));
}

/**
 * Build permission check matrix for verification.
 */
export function buildPermissionMatrix() {
  const matrix = {};
  for (const resource of WORKFLOW_RESOURCES) {
    matrix[resource] = {};
    for (const action of WORKFLOW_ACTIONS) {
      matrix[resource][action] = resolveRequiredPermissions(resource, action);
    }
  }
  return matrix;
}
