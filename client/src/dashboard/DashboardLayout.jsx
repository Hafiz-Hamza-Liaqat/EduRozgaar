import { useTranslation } from 'react-i18next';
import { WidgetZone } from './WidgetRenderer';
import { QuickLinksWidget } from './widgets/QuickLinksWidget';

/**
 * Responsive dashboard layout — hero + main/aside grid (desktop / tablet / mobile).
 * @param {{
 *   layout: { hero?: string[]; main?: string[]; aside?: string[] };
 *   widgets: Record<string, unknown>;
 *   meta?: { version?: string; personalization?: boolean };
 * }} props
 */
export function DashboardLayout({ layout, widgets, meta }) {
  const { t } = useTranslation(['dashboard']);
  const hero = layout?.hero?.length ? layout.hero : ['quick-links'];
  const main = layout?.main || [];
  const aside = layout?.aside || [];
  const isV2 = meta?.version === '2.0';

  const heroWithoutQuickLinks = hero.filter((w) => w !== 'quick-links');
  const showQuickLinks = hero.includes('quick-links');

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {isV2 ? t('dashboard:titleV2', { defaultValue: t('dashboard:title') }) : t('dashboard:title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
          {isV2 ? t('dashboard:widgets.subtitleV2') : t('dashboard:widgets.subtitle')}
        </p>
        {showQuickLinks ? <QuickLinksWidget /> : null}
        {heroWithoutQuickLinks.length > 0 ? (
          <div className="mt-4 space-y-4 md:space-y-6">
            <WidgetZone widgetTypes={heroWithoutQuickLinks} widgets={widgets} />
          </div>
        ) : null}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="md:col-span-2 lg:col-span-2 min-w-0 space-y-6">
          <WidgetZone widgetTypes={main} widgets={widgets} />
        </div>
        <aside className="min-w-0 space-y-6 md:col-span-2 lg:col-span-1">
          <WidgetZone widgetTypes={aside} widgets={widgets} />
        </aside>
      </div>
    </div>
  );
}
