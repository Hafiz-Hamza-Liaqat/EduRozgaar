import { trackAdClick } from '../../utils/adTracking';

/**
 * Direct-sold advertisement creative (image + link).
 * @param {{ slotId?: string, placementId?: string, pageId?: string, preview?: boolean }} [tracking]
 */
export function AdImageCreative({ slot, className = '', variant = 'banner', tracking = null }) {
  if (!slot?.imageUrl) return null;

  const alt = slot.name || 'Advertisement';
  const isSidebar = variant === 'sidebar';

  const handleClick = () => {
    if (tracking) {
      trackAdClick(tracking, { preview: tracking.preview });
    }
  };

  const image = (
    <img
      src={slot.imageUrl}
      alt={alt}
      title={slot.name || undefined}
      className={`w-full h-auto object-contain rounded-lg ${isSidebar ? 'max-w-[300px]' : 'max-h-[250px]'}`}
      loading="lazy"
    />
  );

  const wrapperClass = `block overflow-hidden rounded-lg ${className}`.trim();

  if (slot.targetUrl) {
    const external = /^https?:\/\//i.test(slot.targetUrl);
    return (
      <a
        href={slot.targetUrl}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer sponsored' : undefined}
        className={wrapperClass}
        aria-label={alt}
        onClick={handleClick}
      >
        {image}
      </a>
    );
  }

  return <div className={wrapperClass}>{image}</div>;
}
