import { useSearchParams } from 'react-router-dom';
import { isPageBuilderEnabled, getPageBuilderConfig } from '@shared/pageBuilderConfig.js';
import { usePermissions } from '../../hooks/usePermissions';
import { usePageBuilderLayout } from '../../hooks/usePageBuilderLayout';
import { useCmsStaticPage } from '../../hooks/useCmsStaticPage';
import { PageBuilderPageView } from './PageBuilderPageView';
import { CmsPageView } from '../static/CmsPageView';

function LoadingShell() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500 dark:text-gray-400" aria-busy="true">
      …
    </div>
  );
}

/**
 * Static page runtime: Page Builder (pilot) → Site CMS → legacy i18n fallback (C.6.4.9).
 */
export function StaticCmsPage({ slug, canonical, Fallback }) {
  const [searchParams] = useSearchParams();
  const { isStaff } = usePermissions();
  const builderConfig = getPageBuilderConfig(slug);
  const useBuilder = isPageBuilderEnabled(slug);
  const staffPreview = searchParams.get('pageBuilderPreview') === '1' && isStaff;

  const { layout, loading: builderLoading, ready: builderReady } = usePageBuilderLayout(
    builderConfig?.pageKey || slug,
    { enabled: useBuilder, preview: staffPreview, isStaffPreview: staffPreview }
  );

  const { page, loading: cmsLoading, hasCmsBody } = useCmsStaticPage(slug);

  if (useBuilder && builderLoading) {
    return <LoadingShell />;
  }

  if (useBuilder && builderReady && layout) {
    const seoFallback = page ? {
      title: page.title,
      seoTitle: page.seoTitle,
      metaDescription: page.metaDescription,
      canonicalUrl: page.canonicalUrl,
      ogImageUrl: page.ogImageUrl,
      twitterCard: page.twitterCard,
    } : null;

    return (
      <PageBuilderPageView
        layout={layout}
        canonical={canonical}
        preview={staffPreview}
        seoFallback={seoFallback}
      />
    );
  }

  if (cmsLoading) {
    return <LoadingShell />;
  }

  if (hasCmsBody && page) {
    return <CmsPageView page={page} canonical={canonical} />;
  }

  return <Fallback />;
}
