import { useTranslation } from 'react-i18next';
import { WidgetShell } from '../WidgetShell';

export function RecentAchievementsWidget({ data }) {
  const { t } = useTranslation(['dashboard']);
  const items = data?.items || [];

  return (
    <WidgetShell title={t('dashboard:widgets.recentAchievements')}>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:widgets.noAchievements')}</p>
      ) : (
        <ul className="space-y-2 text-sm" role="list">
          {items.map((item, idx) => {
            const label = item.type === 'readiness'
              ? t('dashboard:widgets.achievementReadiness', { delta: item.delta, overall: item.overall })
              : item.title;
            return (
              <li key={`${item.type}-${idx}`} className="flex justify-between gap-2">
                <span className="text-gray-900 dark:text-white">{label}</span>
                {item.at ? (
                  <time className="text-xs text-gray-500 dark:text-gray-400 shrink-0" dateTime={item.at}>
                    {new Date(item.at).toLocaleDateString()}
                  </time>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </WidgetShell>
  );
}
