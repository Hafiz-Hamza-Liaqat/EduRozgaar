import { useTranslation } from 'react-i18next';
import { usePermissions } from '../../hooks/usePermissions';
import { AdminAccessDenied } from './AdminAccessDenied';

export function AdminRouteGuard({ permission, anyPermission, children }) {
  const { t } = useTranslation('admin');
  const { loading, can, canAny } = usePermissions();

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label={t('loading')}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ))}
      </div>
    );
  }

  const allowed = anyPermission?.length
    ? canAny(anyPermission)
    : permission
      ? can(permission)
      : true;

  if (!allowed) {
    return <AdminAccessDenied />;
  }

  return children;
}
