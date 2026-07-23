import { memo } from 'react';
import { getBlockDefinition } from '@shared/blockRegistry.js';
import { getBlockLayoutSettings, isLayoutVisibleAnywhere } from '@shared/pageBuilderLayout.js';
import { getBlockComponent } from './blockComponentMap';
import { BlockRenderErrorBoundary, UnsupportedBlockPlaceholder } from './BlockRenderErrorBoundary';
import { BlockLayoutShell } from './BlockLayoutShell';

/**
 * Renders a single page-builder block by registry type — no page-specific switches.
 * @param {{ block: import('@shared/blockSchema.js').PageBlock; preview?: boolean; className?: string }} props
 */
function BlockRendererInner({ block, preview = false, className = '' }) {
  if (!block?.enabled) return null;

  const layout = getBlockLayoutSettings(block);
  if (!isLayoutVisibleAnywhere(layout)) return null;

  const definition = getBlockDefinition(block.type);
  if (!definition) {
    return (
      <UnsupportedBlockPlaceholder blockType={block.type} preview={preview} />
    );
  }

  const Component = getBlockComponent(definition.rendererKey);
  if (!Component) {
    return (
      <UnsupportedBlockPlaceholder blockType={definition.displayName || block.type} preview={preview} />
    );
  }

  return (
    <BlockLayoutShell block={block} className={className}>
      <div className={`page-builder-block page-builder-block--${block.type}`.trim()} data-block-id={block.id} data-block-type={block.type}>
        <BlockRenderErrorBoundary preview={preview} blockType={definition.displayName || block.type}>
          <Component block={block} preview={preview} />
        </BlockRenderErrorBoundary>
      </div>
    </BlockLayoutShell>
  );
}

export const BlockRenderer = memo(BlockRendererInner, (prev, next) => (
  prev.block === next.block && prev.preview === next.preview && prev.className === next.className
));

/**
 * Renders an ordered list of blocks.
 * @param {{ blocks: import('@shared/blockSchema.js').PageBlock[]; preview?: boolean; className?: string }} props
 */
export function BlockListRenderer({ blocks, preview = false, className = '' }) {
  const sorted = [...(blocks || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return (
    <div className={className}>
      {sorted.map((block) => (
        <BlockRenderer key={block.id} block={block} preview={preview} />
      ))}
    </div>
  );
}
