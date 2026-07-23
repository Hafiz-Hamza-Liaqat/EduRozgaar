import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ROUTES } from '../../constants';
import { useEmployerDashboardComposition } from '../../employerIntelligence/useEmployerDashboardComposition';
import { EmployerWidgetZone } from '../../employerIntelligence/WidgetRenderer';
import { isEmployerIntelligenceEnabled } from '../../config/careerFeatureFlags';

export default function EmployerIntelligence() {
  const { t } = useTranslation(['employer', 'common']);
  const enabled = isEmployerIntelligenceEnabled();
  const { composition, loading, error } = useEmployerDashboardComposition();

  if (!enabled) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">{t('employer:intelligenceDisabled')}</p>
      </div>
    );
  }

  const layout = composition?.layout || { hero: [], main: [], aside: [] };
  const widgets = composition?.widgets || {};

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Helmet>
        <title>{t('employer:intelligenceSeoTitle')}</title>
        <meta name="description" content={t('employer:intelligenceSeoDesc')} />
      </Helmet>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('employer:intelligenceHeading')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('employer:intelligenceSubtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={ROUTES.EMPLOYER_INTELLIGENCE_CANDIDATES} className="px-3 py-2 rounded-lg bg-primary text-white text-sm min-h-[44px] inline-flex items-center">
            {t('employer:candidateList')}
          </Link>
          <Link to={ROUTES.EMPLOYER_INTELLIGENCE_PIPELINE} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm min-h-[44px] inline-flex items-center">
            {t('employer:hiringPipeline')}
          </Link>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">{t('common:loading')}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && (
        <div className="space-y-6">
          <EmployerWidgetZone widgetTypes={layout.hero} widgets={widgets} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <EmployerWidgetZone widgetTypes={layout.main} widgets={widgets} />
            </div>
            <div>
              <EmployerWidgetZone widgetTypes={layout.aside} widgets={widgets} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
