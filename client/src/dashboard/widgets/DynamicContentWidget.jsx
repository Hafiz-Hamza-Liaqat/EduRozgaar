import { BlockLayoutContext } from '../../components/pageBuilder/BlockLayoutContext';
import { BlockListRenderer } from '../../components/pageBuilder/BlockRenderer';
import { DASHBOARD_DYNAMIC_BLOCKS } from '../dashboardDynamicBlocks';
import { WidgetShell } from '../WidgetShell';
import { useTranslation } from 'react-i18next';

/**
 * Reuses Page Builder Dynamic Blocks — no custom listing logic.
 */
export function DynamicContentWidget() {
  const { t } = useTranslation(['dashboard']);

  return (
    <WidgetShell title={t('dashboard:widgets.dynamicContent')} className="overflow-hidden">
      <BlockLayoutContext.Provider value={{ useLayoutContainer: true, typographyClass: '' }}>
        <BlockListRenderer blocks={DASHBOARD_DYNAMIC_BLOCKS} />
      </BlockLayoutContext.Provider>
    </WidgetShell>
  );
}
