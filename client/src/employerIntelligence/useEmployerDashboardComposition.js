import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { employerApi } from '../services/employerService';
import { DEFAULT_EMPLOYER_DASHBOARD_LAYOUT } from './widgetRegistry';

/** Single composition fetch — widgets stay presentational (no per-widget API). */
export function useEmployerDashboardComposition() {
  const { t } = useTranslation(['employer']);
  const [composition, setComposition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    employerApi
      .intelligenceDashboard()
      .then(({ data }) => {
        if (!cancelled) setComposition(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.error || t('employer:intelligenceLoadFailed'));
          setComposition({ layout: DEFAULT_EMPLOYER_DASHBOARD_LAYOUT, widgets: {}, flags: {} });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [t]);

  return { composition, loading, error };
}
