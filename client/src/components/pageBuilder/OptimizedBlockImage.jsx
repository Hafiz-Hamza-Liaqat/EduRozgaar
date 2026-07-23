import { memo } from 'react';

/**
 * Optimized content image — lazy load, CLS hints, async decode (C.6.4.15).
 */
function OptimizedBlockImageInner({
  src,
  alt = '',
  loading = 'lazy',
  className = '',
  width,
  height,
  aspectRatio = '16 / 9',
}) {
  if (!src) return null;

  const hasDims = Number(width) > 0 && Number(height) > 0;

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      width={hasDims ? width : undefined}
      height={hasDims ? height : undefined}
      className={className}
      style={hasDims ? undefined : { aspectRatio }}
    />
  );
}

export const OptimizedBlockImage = memo(OptimizedBlockImageInner);
