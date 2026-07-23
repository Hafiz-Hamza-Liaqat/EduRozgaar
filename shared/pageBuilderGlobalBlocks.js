/**
 * Global block resolution & validation (C.6.4.12).
 */
import { getBlockDefinitionMap } from './blockRegistry.js';
import { sortBlocks, validateBlockConfig } from './blockSchema.js';

const definitionMap = getBlockDefinitionMap();

/**
 * @param {import('./blockSchema.js').PageBlock[]} blocks
 */
export function collectGlobalBlockIds(blocks) {
  const ids = new Set();
  for (const block of blocks || []) {
    if (block?.globalBlockId) ids.add(String(block.globalBlockId));
  }
  return [...ids];
}

/**
 * @param {import('./blockSchema.js').PageBlock} block
 * @param {Map<string, { blockType: string; config?: Record<string, unknown>; enabled?: boolean; name?: string }>} globalMap
 */
export function resolveBlockForRender(block, globalMap) {
  if (!block?.globalBlockId) return block;
  const global = globalMap?.get(String(block.globalBlockId));
  if (!global) return null;
  if (global.enabled === false) return null;
  return {
    ...block,
    type: global.blockType || block.type,
    config: global.config && typeof global.config === 'object' ? global.config : {},
    metadata: {
      ...(block.metadata || {}),
      globalBlockId: block.globalBlockId,
      globalBlockName: global.name,
    },
  };
}

/**
 * @param {import('./blockSchema.js').PageBlock[]} blocks
 * @param {Map<string, object>} globalMap
 */
export function resolveBlocksForRender(blocks, globalMap) {
  return sortBlocks(blocks)
    .map((block) => resolveBlockForRender(block, globalMap))
    .filter(Boolean);
}

/**
 * @param {import('./blockSchema.js').PageBlock} block
 * @param {string} globalBlockId
 * @param {{ blockType: string }} globalMeta
 */
export function convertBlockToGlobalReference(block, globalBlockId, globalMeta) {
  return {
    ...block,
    type: globalMeta.blockType || block.type,
    globalBlockId: String(globalBlockId),
    config: {},
    metadata: {
      ...(block.metadata || {}),
      isGlobal: true,
    },
  };
}

/**
 * @param {import('./blockSchema.js').PageBlock} block
 * @param {{ config?: Record<string, unknown>; blockType?: string } | null} global
 */
export function detachBlockFromGlobal(block, global) {
  const next = { ...block };
  delete next.globalBlockId;
  next.config = JSON.parse(JSON.stringify(global?.config || block.config || {}));
  if (global?.blockType) next.type = global.blockType;
  next.metadata = { ...(block.metadata || {}), isGlobal: false };
  return next;
}

/**
 * @param {import('./blockSchema.js').PageBlock} block
 * @param {Map<string, object>} [globalMap]
 */
export function resolveBlockForValidation(block, globalMap) {
  if (!block?.globalBlockId) return block;
  const global = globalMap?.get(String(block.globalBlockId));
  if (!global) return block;
  return {
    ...block,
    type: global.blockType || block.type,
    config: global.config || {},
  };
}

/**
 * @param {import('./blockSchema.js').PageBlock[]} blocks
 * @param {Map<string, object>} [globalMap]
 */
export function validatePageBlocksWithGlobals(blocks, globalMap = new Map()) {
  /** @type {string[]} */
  const errors = [];
  const ids = new Set();

  for (const block of blocks || []) {
    if (ids.has(block.id)) errors.push(`Duplicate block id: ${block.id}`);
    ids.add(block.id);

    if (block.globalBlockId) {
      const global = globalMap.get(String(block.globalBlockId));
      if (!global) {
        errors.push(`[${block.id}] Global block not found: ${block.globalBlockId}`);
        continue;
      }
      if (global.enabled === false) {
        errors.push(`[${block.id}] Global block "${global.name || block.globalBlockId}" is disabled`);
      }
      const def = definitionMap.get(global.blockType);
      if (!def) {
        errors.push(`[${block.id}] Unknown global block type: ${global.blockType}`);
        continue;
      }
      const virtual = { ...block, type: global.blockType, config: global.config || {} };
      errors.push(...validateBlockConfig(virtual, def).map((e) => `[${block.id}] ${e}`));
      continue;
    }

    const def = definitionMap.get(block.type);
    if (!def) {
      errors.push(`Unknown block type: ${block.type}`);
      continue;
    }
    errors.push(...validateBlockConfig(block, def).map((e) => `[${block.id}] ${e}`));
  }

  return errors;
}

/**
 * @param {object[]} globals
 */
export function validateGlobalBlockDocument(doc) {
  const def = definitionMap.get(doc?.blockType);
  if (!def) return [`Unknown block type: ${doc?.blockType}`];
  const virtual = {
    id: 'global',
    type: doc.blockType,
    enabled: true,
    config: doc.config || {},
  };
  return validateBlockConfig(virtual, def);
}

/**
 * Build a Map from API array response.
 * @param {object[]} items
 */
export function globalBlockMapFromList(items) {
  const map = new Map();
  for (const item of items || []) {
    const id = String(item._id || item.id || '');
    if (id) map.set(id, item);
  }
  return map;
}
