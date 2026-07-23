import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPermissionsForRole, hasPermission, isStaffRole } from '../config/rbac';
import { adminApi } from '../services/listingsService';

let sharedPermissionsPromise = null;
let sharedPermissionsCache = { role: null, permissions: [] };

function fetchPermissionsOnce(role) {
  if (sharedPermissionsCache.role === role && sharedPermissionsCache.permissions.length) {
    return Promise.resolve(sharedPermissionsCache.permissions);
  }
  if (!sharedPermissionsPromise) {
    sharedPermissionsPromise = adminApi.permissions()
      .then(({ data }) => {
        const perms = data.permissions || getPermissionsForRole(role);
        sharedPermissionsCache = { role, permissions: perms };
        return perms;
      })
      .catch(() => getPermissionsForRole(role))
      .finally(() => {
        sharedPermissionsPromise = null;
      });
  }
  return sharedPermissionsPromise;
}

export function resetPermissionsCache() {
  sharedPermissionsCache = { role: null, permissions: [] };
  sharedPermissionsPromise = null;
}

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role;
  const [permissions, setPermissions] = useState(() => getPermissionsForRole(role));
  const [loading, setLoading] = useState(isStaffRole(role));
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!role || !isStaffRole(role)) {
      setPermissions([]);
      setLoading(false);
      return () => { mountedRef.current = false; };
    }
    setPermissions(getPermissionsForRole(role));
    setLoading(true);
    fetchPermissionsOnce(role)
      .then((perms) => {
        if (mountedRef.current) setPermissions(perms);
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
    return () => { mountedRef.current = false; };
  }, [role]);

  const can = useCallback(
    (perm) => {
      if (role === 'SuperAdmin') return true;
      if (permissions?.length) return permissions.includes(perm);
      return hasPermission(role, perm);
    },
    [role, permissions]
  );

  const canAny = useCallback(
    (perms) => perms.some((p) => can(p)),
    [can]
  );

  return {
    role,
    permissions,
    loading,
    isStaff: isStaffRole(role),
    can,
    canAny,
  };
}
