import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { WidgetShell } from '../WidgetShell';

export function NotificationCenterWidget({ data }) {
  const { t } = useTranslation(['dashboard']);
  const items = data?.items || [];

  return (
    <WidgetShell
      title={t('dashboard:widgets.notificationCenter')}
      action={(
        <Link to={ROUTES.NOTIFICATIONS} className="text-sm text-primary dark:text-mint hover:underline">
          {t('dashboard:viewAllArrow')}
        </Link>
      )}
    >
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {t('dashboard:widgets.unreadCount', { count: data?.unreadCount ?? 0 })}
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:widgets.noNotifications')}</p>
      ) : (
        <ul className="space-y-2 text-sm" role="list">
          {items.map((n) => (
            <li key={n._id} className={n.read ? 'opacity-70' : ''}>
              {n.link ? (
                <Link to={n.link} className="font-medium text-primary dark:text-mint hover:underline">
                  {n.title}
                </Link>
              ) : (
                <span className="font-medium text-gray-900 dark:text-white">{n.title}</span>
              )}
              {n.body ? <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{n.body}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}
