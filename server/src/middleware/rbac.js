import { hasPermission, hasAnyPermission, isStaffRole } from '../config/rbac.js';

export function requireStaff(req, res, next) {
  if (!req.user?.role) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!isStaffRole(req.user.role)) {
    return res.status(403).json({ error: 'Staff access required' });
  }
  next();
}

export function requirePermission(...permissions) {
  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const ok = permissions.length === 1
      ? hasPermission(req.user.role, permissions[0])
      : hasAnyPermission(req.user.role, permissions);
    if (!ok) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== 'SuperAdmin') {
    return res.status(403).json({ error: 'Super Admin access required' });
  }
  next();
}
