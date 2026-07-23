import { useTranslation } from 'react-i18next';
import { ActivityFeed } from '../../components/timeline/ActivityFeed';
import { WidgetShell } from '../WidgetShell';

/**
 * Reuses ActivityFeed with server-composed timeline data (no duplicate fetch).
 * @param {{ data?: { items?: object[] } }} props
 */
export function TimelineWidget({ data }) {
  const { t } = useTranslation(['dashboard', 'timeline']);

  return (
    <WidgetShell title={t('dashboard:widgets.timeline')}>
      <ActivityFeed
        prefetchedItems={data?.items}
        title={t('dashboard:widgets.timeline')}
      />
    </WidgetShell>
  );
}
