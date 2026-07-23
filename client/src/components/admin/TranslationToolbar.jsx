import { useCallback, useEffect, useState } from 'react';
import { adminContentApi } from '../../services/adminContentApi';
import { ENABLED_CONTENT_LOCALES } from '@shared/localization/localeConfig.js';
import { translationStatusLabel, computeTranslationCompleteness } from '@shared/localization/translationStatus.js';

const STATUS_CLASS = {
  draft: 'bg-gray-100 text-gray-700',
  needs_translation: 'bg-amber-100 text-amber-800',
  needs_update: 'bg-orange-100 text-orange-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-slate-100 text-slate-600',
};

/**
 * Admin translation toolbar — status badges, create/open translation (C.7.0.8).
 */
export function TranslationToolbar({
  entityType,
  entityId,
  currentLocale = 'en',
  onOpenTranslation,
}) {
  const [variants, setVariants] = useState([]);
  const [completeness, setCompleteness] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!entityType || !entityId) return;
    setLoading(true);
    try {
      const { data } = await adminContentApi.getTranslationGroup(entityType, entityId);
      setVariants(data?.variants || []);
      setCompleteness(data?.completeness || null);
    } catch {
      setVariants([]);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => { load(); }, [load]);

  const createTranslation = async (locale) => {
    const { data } = await adminContentApi.createTranslation(entityType, entityId, { locale });
    await load();
    onOpenTranslation?.(data?.doc, locale);
  };

  const missing = completeness?.missing || ENABLED_CONTENT_LOCALES.filter(
    (loc) => !variants.some((v) => v.locale === loc),
  );

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2 bg-gray-50/50 dark:bg-gray-900/30">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Translations
        </span>
        {completeness ? (
          <span className="text-xs text-gray-500">{completeness.percent}% complete</span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {variants.map((v) => (
          <button
            key={v._id}
            type="button"
            onClick={() => onOpenTranslation?.(v, v.locale)}
            className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_CLASS[v.translationStatus] || STATUS_CLASS.draft} ${
              v.locale === currentLocale ? 'ring-2 ring-primary ring-offset-1' : ''
            }`}
          >
            {v.locale.toUpperCase()} · {translationStatusLabel(v.translationStatus)}
          </button>
        ))}
        {loading ? <span className="text-xs text-gray-400">Loading…</span> : null}
      </div>
      {missing?.length ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {missing.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => createTranslation(loc)}
              className="text-xs px-2 py-1 rounded border border-dashed border-primary text-primary hover:bg-primary/5"
            >
              + Create {loc.toUpperCase()}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { computeTranslationCompleteness, translationStatusLabel };
