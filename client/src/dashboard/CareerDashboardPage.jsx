import { useTranslation } from 'react-i18next';
import { SeoHead } from '../components/seo';
import { ListingCardSkeleton } from '../components/listings/ListingCardSkeleton';
import { DashboardLayout } from './DashboardLayout';
import { useDashboardComposition } from './useDashboardComposition';

export default function CareerDashboardPage() {
  const { t } = useTranslation(['dashboard']);
  const { composition, loading, error } = useDashboardComposition();

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 min-w-0 w-full">
        <SeoHead title={t('dashboard:seoTitle')} description={t('dashboard:seoDescriptionShort')} noindex />
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <ListingCardSkeleton />
              <ListingCardSkeleton />
            </div>
            <ListingCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error && !composition?.layout) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 min-w-0 w-full">
        <SeoHead title={t('dashboard:seoTitle')} noindex />
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <>
      <SeoHead title={t('dashboard:seoTitle')} description={t('dashboard:seoDescription')} noindex />
      <div className="max-w-6xl mx-auto px-4 py-8 min-w-0 w-full">
        {error ? (
          <p className="mb-4 text-sm text-amber-600 dark:text-amber-400" role="status">{error}</p>
        ) : null}
        <DashboardLayout
          layout={composition.layout}
          widgets={composition.widgets}
          meta={composition.meta}
        />
      </div>
    </>
  );
}
