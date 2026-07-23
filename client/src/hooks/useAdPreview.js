import { useSearchParams } from 'react-router-dom';

/**
 * Read ?previewAd=placement-id for admin advertisement preview.
 */
export function useAdPreview() {
  const [searchParams] = useSearchParams();
  const previewPlacementId = searchParams.get('previewAd') || '';

  const isPreviewTarget = (placementId) => (
    Boolean(previewPlacementId) && previewPlacementId === placementId
  );

  return { previewPlacementId, isPreviewTarget };
}
