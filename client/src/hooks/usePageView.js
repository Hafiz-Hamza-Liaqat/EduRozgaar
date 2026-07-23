import { useEffect, useRef } from 'react';
import { trackPageView, trackContentView } from '../utils/platformAnalytics';

/**
 * Track page view once on mount (C.7.0.7.1).
 * @param {'page'|'page-builder'} [pageType]
 */
export function usePageView(pageType = 'page') {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackPageView(pageType);
  }, [pageType]);
}

/**
 * Track content entity view once on mount.
 * @param {string} entityType
 * @param {string} entityId
 * @param {string} [eventType]
 */
export function useContentView(entityType, entityId, eventType) {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current || !entityId) return;
    tracked.current = true;
    trackContentView(entityType, entityId, eventType);
  }, [entityType, entityId, eventType]);
}
