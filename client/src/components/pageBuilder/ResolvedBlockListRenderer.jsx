import { memo } from 'react';
import { BlockListRenderer } from './BlockRenderer';
import { useResolvedPageBlocks } from '../../hooks/useGlobalBlocks';

function ResolvedBlockListRendererInner({ blocks, preview = false, adminContext = false, className = '' }) {
  const { resolved, loading } = useResolvedPageBlocks(blocks, { admin: adminContext });

  if (loading && resolved.length === 0 && (blocks || []).some((b) => b.globalBlockId)) {
    return <p className="text-sm text-gray-500 p-4">Loading shared blocks…</p>;
  }

  return <BlockListRenderer blocks={resolved} preview={preview} className={className} />;
}

export const ResolvedBlockListRenderer = memo(ResolvedBlockListRendererInner);
