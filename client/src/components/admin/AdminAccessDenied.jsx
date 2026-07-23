import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';

export function AdminAccessDenied({ message }) {
  const { t } = useTranslation(['admin', 'static']);

  return (
    <div
      className="max-w-lg mx-auto px-4 py-12 text-center rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30"
      role="alert"
      aria-live="polite"
    >
      <p className="text-6xl font-bold text-red-400 dark:text-red-500 mb-2" aria-hidden="true">
        403
      </p>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {t('admin:accessDeniedTitle')}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {message || t('admin:accessDeniedMessage')}
      </p>
      <Link
        to={ROUTES.ADMIN}
        className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90"
      >
        {t('admin:backToOverview')}
      </Link>
    </div>
  );
}
