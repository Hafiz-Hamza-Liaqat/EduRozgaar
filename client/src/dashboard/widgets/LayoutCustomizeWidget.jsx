import { useTranslation } from 'react-i18next';
import { WidgetShell } from '../WidgetShell';

/**
 * Layout personalization entry — drag-and-drop persisted when flag on; placeholder otherwise.
 */
export function LayoutCustomizeWidget({ data }) {
  const { t } = useTranslation(['dashboard']);
  const enabled = Boolean(data?.personalizationEnabled);
  const dragDrop = Boolean(data?.dragDrop);

  return (
    <WidgetShell title={t('dashboard:widgets.layoutCustomize')}>
      {enabled && dragDrop ? (
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <p>{t('dashboard:widgets.layoutCustomizeHint')}</p>
          {data.hasSavedLayout ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard:widgets.layoutSaved')}</p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard:widgets.layoutDefault')}</p>
          )}
          <p className="text-xs text-amber-700 dark:text-amber-300" role="note">
            {t('dashboard:widgets.layoutReorderNote')}
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:widgets.layoutPlaceholder')}</p>
      )}
    </WidgetShell>
  );
}
