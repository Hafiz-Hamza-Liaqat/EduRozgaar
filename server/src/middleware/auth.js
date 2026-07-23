import { verifyToken } from '../utils/jwt.js';
import { isAccessTokenRevoked } from '../utils/tokenStore.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  isAccessTokenRevoked(token)
    .then((revoked) => {
      if (revoked) {
        return res.status(401).json({ error: 'Token has been revoked' });
      }
      try {
        const decoded = verifyToken(token);
        if (decoded.type === 'refresh') {
          return res.status(401).json({ error: 'Use access token for this request' });
        }
        if (decoded.employerId && decoded.role === 'employer') {
          req.employer = { employerId: decoded.employerId, role: 'employer' };
        } else {
          req.user = { userId: decoded.userId, role: decoded.role };
        }
        next();
      } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    })
    .catch(() => res.status(401).json({ error: 'Authentication failed' }));
}

/** Requires a User token (not Employer). Use for candidate-facing routes. */
export function requireUserAuth(req, res, next) {
  if (req.employer) {
    return res.status(403).json({ error: 'Employer account cannot access this resource' });
  }
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

/** Optional auth — attaches user/employer when valid token present; never rejects. */
export function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return next();
  isAccessTokenRevoked(token)
    .then((revoked) => {
      if (revoked) return next();
      try {
        const decoded = verifyToken(token);
        if (decoded.type === 'refresh') return next();
        if (decoded.employerId && decoded.role === 'employer') {
          req.employer = { employerId: decoded.employerId, role: 'employer' };
        } else {
          req.user = { userId: decoded.userId, role: decoded.role, email: decoded.email, name: decoded.name };
        }
      } catch {
        /* ignore invalid token */
      }
      next();
    })
    .catch(() => next());
}

/** Requires an Employer token. Use for employer dashboard routes. */
export function requireEmployerAuth(req, res, next) {
  if (!req.employer) {
    return res.status(401).json({ error: 'Employer authentication required' });
  }
  next();
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export const requireAdmin = requireRole('Admin', 'SuperAdmin');
export const requireUser = requireRole('User', 'Admin');
