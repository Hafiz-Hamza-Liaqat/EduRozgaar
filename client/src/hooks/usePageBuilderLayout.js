import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { siteContentApi } from '../services/siteContentApi';
import { adminContentApi } from '../services/adminContentApi';
import {
  isRenderablePageLayout,
  normalizePageLayoutPayload,
} from '@shared/pageBuilderRuntime.js';

/**
 * Load published (or staff draft preview) Page Builder layout.
 * @param {string} pageKey
 * @param {{ enabled?: boolean; preview?: boolean; isStaffPreview?: boolean }} options
 */
export function usePageBuilderLayout(pageKey, options = {}) {
  const { enabled = true, preview = false, isStaffPreview = false } = options;
  const { lang } = useLanguage();
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled || !pageKey) {
      setLayout(null);
      setReady(false);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setReady(false);

    const loadPublished = siteContentApi.getPageLayout(pageKey, lang)
      .then((res) => normalizePageLayoutPayload(res.data))
      .catch(() => null);

    const loadPreview = isStaffPreview && preview
      ? adminContentApi.previewPageLayout(pageKey, lang)
          .then((res) => normalizePageLayoutPayload({ ...res.data, preview: true, status: 'draft' }))
          .catch(() => null)
      : Promise.resolve(null);

    Promise.all([loadPreview, loadPublished])
      .then(([previewLayout, publishedLayout]) => {
        if (cancelled) return;
        const candidate = previewLayout || publishedLayout;
        const renderable = candidate && isRenderablePageLayout(candidate, {
          preview: Boolean(previewLayout),
          requirePublished: !previewLayout,
        });
        if (renderable) {
          setLayout(candidate);
          setReady(true);
        } else {
          setLayout(null);
          setReady(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [pageKey, lang, enabled, preview, isStaffPreview]);

  return { layout, loading, ready };
}
