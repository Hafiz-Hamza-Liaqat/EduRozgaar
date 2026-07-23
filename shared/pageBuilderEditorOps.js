/**
 * Page Builder editor operations — reorder, duplicate, dirty detection (C.6.4.11).
 * Editor-only; does not change runtime, registry, or API contracts.
 */
import {
  createBlock,
  assignBlockOrder,
  reindexBlocks,
  sortBlocks,
} from './blockSchema.js';

/**
 * @param {import('./blockSchema.js').PageBlock[]} blocks
 * @param {string} activeId
 * @param {string} overId
 */
export function reorderBlocksByIds(blocks, activeId, overId) {
  if (!activeId || !overId || activeId === overId) return blocks;
  const sorted = sortBlocks(blocks);
  const oldIndex = sorted.findIndex((b) => b.id === activeId);
  const newIndex = sorted.findIndex((b) => b.id === overId);
  if (oldIndex < 0 || newIndex < 0) return blocks;
  const next = [...sorted];
  const [moved] = next.splice(oldIndex, 1);
  next.splice(newIndex, 0, moved);
  return assignBlockOrder(next);
}

/**
 * @param {import('./blockSchema.js').PageBlock[]} blocks
 * @param {string} blockId
 */
export function duplicateBlockInList(blocks, blockId) {
  const sorted = sortBlocks(blocks);
  const idx = sorted.findIndex((b) => b.id === blockId);
  if (idx < 0) return blocks;
  const source = sorted[idx];
  const copy = createBlock(
    source.type,
    structuredClone(source.config || {}),
    {
      enabled: source.enabled,
      metadata: structuredClone(source.metadata || {}),
    },
  );
  const next = [...sorted];
  next.splice(idx + 1, 0, copy);
  return assignBlockOrder(next);
}

/**
 * @param {import('./blockSchema.js').PageBlock[]} blocks
 * @param {string} blockId
 */
export function moveBlockToTop(blocks, blockId) {
  const sorted = sortBlocks(blocks);
  const idx = sorted.findIndex((b) => b.id === blockId);
  if (idx <= 0) return blocks;
  const next = [...sorted];
  const [item] = next.splice(idx, 1);
  next.unshift(item);
  return assignBlockOrder(next);
}

/**
 * @param {import('./blockSchema.js').PageBlock[]} blocks
 * @param {string} blockId
 */
export function moveBlockToBottom(blocks, blockId) {
  const sorted = sortBlocks(blocks);
  const idx = sorted.findIndex((b) => b.id === blockId);
  if (idx < 0 || idx >= sorted.length - 1) return blocks;
  const next = [...sorted];
  const [item] = next.splice(idx, 1);
  next.push(item);
  return assignBlockOrder(next);
}

/**
 * @param {string} title
 * @param {import('./blockSchema.js').PageBlock[]} blocks
 */
export function createDraftSnapshot(title, blocks) {
  const sorted = sortBlocks(blocks);
  return JSON.stringify({
    title: String(title || '').trim(),
    blocks: sorted.map((b) => ({
      id: b.id,
      type: b.type,
      order: b.order,
      enabled: b.enabled !== false,
      config: b.config || {},
      metadata: b.metadata || {},
      globalBlockId: b.globalBlockId || undefined,
    })),
  });
}

/**
 * @param {string} currentTitle
 * @param {import('./blockSchema.js').PageBlock[]} currentBlocks
 * @param {string|null|undefined} baselineSnapshot
 */
export function isDraftDirty(currentTitle, currentBlocks, baselineSnapshot) {
  if (!baselineSnapshot) return false;
  return createDraftSnapshot(currentTitle, currentBlocks) !== baselineSnapshot;
}

/**
 * @param {import('./blockSchema.js').PageBlock[]} blocks
 * @returns {{ ok: boolean; errors: string[] }}
 */
export function validateBlockIdStability(blocks) {
  /** @type {string[]} */
  const errors = [];
  const ids = new Set();
  for (const block of blocks || []) {
    if (!block?.id) errors.push('Block missing id');
    else if (ids.has(block.id)) errors.push(`Duplicate block id: ${block.id}`);
    else ids.add(block.id);
  }
  return { ok: errors.length === 0, errors };
}

/**
 * @param {import('./blockSchema.js').PageBlock[]} before
 * @param {import('./blockSchema.js').PageBlock[]} after
 */
export function preserveBlockIdsOnReorder(before, after) {
  const beforeIds = sortBlocks(before).map((b) => b.id);
  const afterIds = sortBlocks(after).map((b) => b.id);
  if (beforeIds.length !== afterIds.length) return false;
  const beforeSet = new Set(beforeIds);
  return afterIds.every((id) => beforeSet.has(id));
}
