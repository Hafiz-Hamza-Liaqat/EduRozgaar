/**
 * PermissionService — action-based permission engine (C.7.0.6).
 * Wraps existing RBAC; supports multiple roles per user via UserRoleAssignment.
 */
import {
  getPermissionsForRole,
  hasPermission,
  hasAnyPermission,
  ROLES,
  PERMISSIONS,
} from '../../config/rbac.js';
import { WORKFLOW_PERMISSIONS, canPerformWorkflowAction } from '../../../../shared/workflow/permissions.js';
import { UserRoleAssignment } from '../../models/UserRoleAssignment.js';

export { PERMISSIONS, WORKFLOW_PERMISSIONS };

/** Role names (canonical). */
export const Role = ROLES;

/**
 * Flatten permissions from all roles (deduped).
 * @param {string[]} roles
 */
export function getPermissionsForRoles(roles = []) {
  const set = new Set();
  for (const role of roles) {
    for (const p of getPermissionsForRole(role)) set.add(p);
  }
  return [...set];
}

/**
 * @param {string} userId
 * @param {string} primaryRole
 */
export async function getEffectiveRoles(userId, primaryRole) {
  const roles = new Set();
  if (primaryRole) roles.add(primaryRole);
  if (userId) {
    const extra = await UserRoleAssignment.findOne({ userId }).lean();
    for (const r of extra?.roles || []) roles.add(r);
  }
  return [...roles];
}

/**
 * @param {string} userId
 * @param {string} primaryRole
 */
export async function getEffectivePermissions(userId, primaryRole) {
  const roles = await getEffectiveRoles(userId, primaryRole);
  if (roles.includes(ROLES.SUPER_ADMIN)) {
    return [...new Set([...Object.values(PERMISSIONS), ...Object.values(WORKFLOW_PERMISSIONS)])];
  }
  return getPermissionsForRoles(roles);
}

/**
 * @param {{ userId?: string, role?: string, permissions?: string[] }} user
 * @param {string} resource
 * @param {string} action
 */
export async function canPerformAction(user, resource, action) {
  if (!user) return false;
  if (user.role === ROLES.SUPER_ADMIN) return true;
  const perms = user.permissions?.length
    ? user.permissions
    : await getEffectivePermissions(user.userId || user._id, user.role);
  return canPerformWorkflowAction(perms, resource, action);
}

/**
 * @param {string} role
 * @param {string} permission
 */
export function roleHasPermission(role, permission) {
  return hasPermission(role, permission);
}

/**
 * @param {string} role
 * @param {string[]} permissions
 */
export function roleHasAnyPermission(role, permissions) {
  return hasAnyPermission(role, permissions);
}

/**
 * Assign additional staff roles (additive; does not replace primary User.role).
 */
export async function assignAdditionalRoles(userId, roles) {
  return UserRoleAssignment.findOneAndUpdate(
    { userId },
    { $set: { roles } },
    { upsert: true, new: true }
  );
}
