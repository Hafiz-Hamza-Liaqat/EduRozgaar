import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { siteContentApi } from '../services/siteContentApi';

/**
 * Fetch published CMS static page by slug with locale fallback.
 * Returns null page when CMS content is unavailable (caller should use i18n fallback).
 */
export function useCmsStaticPage(slug) {
  const { lang } = useLanguage();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    siteContentApi
      .getPage(slug, lang)
      .then((res) => {
        if (!cancelled) setPage(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setPage(null);
          if (err.response?.status !== 404) setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug, lang]);

  const hasCmsBody = !!(page?.content?.trim() || page?.sections?.length);

  return { page, loading, error, hasCmsBody };
}
