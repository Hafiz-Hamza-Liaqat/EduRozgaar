import { useEffect, useRef, useState } from 'react';
import { getPlacementById } from '@shared/placementRegistry.js';
import { useAdSlots } from '../../context/AdSlotsContext';
import { useAdPreview } from '../../hooks/useAdPreview';
import {
  findSlotForPlacement,
  getAdAnchorId,
  resolveEffectiveSlotId,
  slotHasCreative,
} from '../../utils/adSlotUtils';
import { trackAdImpression } from '../../utils/adTracking';
import { AdImageCreative } from './AdImageCreative';
import { AdBanner } from './AdBanner';

/**
 * Registry-driven advertisement host.
 * @param {string} placementId - Placement registry id (e.g. blog-header)
 * @param {number} [index] - In-feed index suffix
 * @param {string} [className]
 * @param {'banner'|'sidebar'|'inline'} [variant]
 */
export function AdHost({ placementId, index = null, className = '', variant = 'banner' }) {
  const { slots, loading } = useAdSlots();
  const { previewPlacementId, isPreviewTarget } = useAdPreview();
  const ref = useRef(null);
  const [highlight, setHighlight] = useState(false);

  const placement = getPlacementById(placementId);
  const isPreviewSession = Boolean(previewPlacementId);
  const previewMode = isPreviewTarget(placementId);

  const slot = placement
    ? (() => {
      if (previewMode && typeof window !== 'undefined') {
        try {
          const raw = sessionStorage.getItem(`adPreviewSlot:${placementId}`);
          if (raw) return JSON.parse(raw);
        } catch { /* ignore */ }
      }
      return findSlotForPlacement(slots, placement, index, { previewBypass: previewMode });
    })()
    : null;

  const effectiveSlotId = placement ? resolveEffectiveSlotId(placement, index) : '';
  const anchorId = getAdAnchorId(placementId);

  const tracking = slot && effectiveSlotId
    ? {
      slotId: effectiveSlotId,
      placementId,
      pageId: placement?.pageId,
      preview: isPreviewSession,
    }
    : null;

  useEffect(() => {
    if (!previewMode) return undefined;
    const scrollTimer = setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlight(true);
    }, 300);
    const offTimer = setTimeout(() => setHighlight(false), 4000);
    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(offTimer);
    };
  }, [previewMode, placementId, loading]);

  useEffect(() => {
    if (!tracking || tracking.preview || !ref.current) return undefined;

    const el = ref.current;
    let observed = true;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!observed || !entry?.isIntersecting || entry.intersectionRatio < 0.5) return;
        observed = false;
        trackAdImpression(tracking, { preview: tracking.preview });
        observer.disconnect();
      },
      { threshold: [0.5] }
    );

    observer.observe(el);
    return () => {
      observed = false;
      observer.disconnect();
    };
  }, [tracking?.slotId, tracking?.placementId, tracking?.pageId, tracking?.preview]);

  if (!placement || loading) return null;

  if (!slot) return null;

  const hasImage = slotHasCreative(slot);
  const sidebar = variant === 'sidebar' || placement.slotType === 'sidebar';

  const highlightClass = highlight
    ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 animate-pulse'
    : '';

  return (
    <div
      ref={ref}
      id={anchorId}
      data-ad-placement={placementId}
      data-ad-slot={effectiveSlotId}
      className={`ad-host ${sidebar ? 'ad-host-sidebar' : 'ad-host-banner'} ${highlightClass} ${className}`.trim()}
    >
      {hasImage ? (
        <AdImageCreative slot={slot} variant={sidebar ? 'sidebar' : 'banner'} tracking={tracking} />
      ) : (
        <AdBanner slotId={effectiveSlotId} className={sidebar ? 'min-h-[250px]' : ''} />
      )}
      {previewMode && (
        <p className="mt-1 text-xs text-center text-yellow-700 dark:text-yellow-400 font-medium">
          Advertisement preview
        </p>
      )}
    </div>
  );
}
