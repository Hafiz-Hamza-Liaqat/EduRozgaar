import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { timelineApi } from '../../services/timelineApi';
import { isTimelineEnabled } from '../../config/careerFeatureFlags';
import { formatApplicationDate } from '../../utils/applicationUi';

function labelForEvent(event, t) {
  const verb = event.verb || event.activityType;
  const meta = event.metadata || {};
  const stageLabel = (key) => t(`timeline:stages.${meta[key]}`, { defaultValue: meta[key] || '' });

  if (verb === 'application.stage_changed' || verb === 'application.withdrawn' || verb === 'offer.accepted') {
    return t(`timeline:verbs.${verb}`, {
      fromStage: stageLabel('fromStage'),
      toStage: stageLabel('toStage'),
      defaultValue: event.summary || verb,
    });
  }

  if (verb === 'application.reminder_created') {
    return t(`timeline:verbs.${verb}`, {
      title: meta.title || '',
      defaultValue: event.summary || verb,
    });
  }

  if (verb === 'application.document_attached') {
    return t(`timeline:verbs.${verb}`, {
      role: meta.role || '',
      defaultValue: event.summary || verb,
    });
  }

  return t(`timeline:verbs.${verb}`, { defaultValue: event.summary || verb });
}

/**
 * Reusable read-only timeline feed (C.8.0.4).
 * @param {{ applicationId?: string; prefetchedItems?: object[]; fallbackItems?: object[]; title?: string; className?: string }} props
 */
export function ActivityFeed({ applicationId, prefetchedItems, fallbackItems = [], title, className = '' }) {
  const { t, i18n } = useTranslation(['timeline', 'applications', 'common']);
  const [items, setItems] = useState(prefetchedItems ?? fallbackItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (prefetchedItems) {
      setItems(prefetchedItems);
      setLoading(false);
      setError('');
      return undefined;
    }

    if (!isTimelineEnabled()) {
      setItems(fallbackItems);
      setLoading(false);
      return undefined;
    }

    if (!applicationId) {
      setLoading(true);
      timelineApi
        .listMine({ limit: 8 })
        .then(({ data }) => setItems(data.data || []))
        .catch(() => {
          setError(t('timeline:loadError'));
          setItems(fallbackItems);
        })
        .finally(() => setLoading(false));
      return undefined;
    }

    setLoading(true);
    timelineApi
      .listForApplication(applicationId, { limit: 50 })
      .then(({ data }) => setItems(data.data || []))
      .catch(() => {
        setError(t('timeline:loadError'));
        setItems(fallbackItems);
      })
      .finally(() => setLoading(false));
    return undefined;
  }, [applicationId, prefetchedItems, t]);

  const heading = title || t('applications:detail.activityTitle');

  if (!isTimelineEnabled() && !prefetchedItems?.length && fallbackItems.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400" role="status">
        {t('timeline:featureDisabled')}
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-gray-500 dark:text-gray-400" role="status">{t('common:loading', { defaultValue: 'Loading…' })}</p>;
  }

  if (error && items.length === 0) {
    return <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('timeline:empty')}
      </p>
    );
  }

  return (
    <ul className={`space-y-2 ${className}`} role="list" aria-label={heading}>
      {items.map((event) => {
        const key = event._id || event.referenceId || `${event.verb}-${event.occurredAt}`;
        const occurredAt = event.occurredAt;
        return (
          <li key={key} className="text-sm">
            <p className="text-gray-800 dark:text-gray-200">{labelForEvent(event, t)}</p>
            {occurredAt && (
              <time className="text-xs text-gray-500 dark:text-gray-400" dateTime={occurredAt}>
                {formatApplicationDate(occurredAt, i18n.language, { time: true })}
              </time>
            )}
          </li>
        );
      })}
    </ul>
  );
}
