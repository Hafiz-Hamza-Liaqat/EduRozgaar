/**
 * Canonical page-builder block schema (C.6.4.8).
 * Additive — does not replace existing CMS document shapes.
 */

/** @typedef {'text'|'textarea'|'number'|'boolean'|'select'|'url'|'placementId'|'richtext'|'color'|'range'} BlockFieldType */

/**
 * @typedef {Object} BlockFieldDefinition
 * @property {string} key
 * @property {string} label
 * @property {BlockFieldType} type
 * @property {boolean} [required]
 * @property {string} [placeholder]
 * @property {{ value: string, label: string }[]} [options]
 * @property {number} [min]
 * @property {number} [max]
 * @property {*} [defaultValue]
 */

/**
 * @typedef {Object} PageBlock
 * @property {string} id
 * @property {string} type
 * @property {number} order
 * @property {boolean} enabled
 * @property {Record<string, unknown>} config
 * @property {Record<string, unknown>} [metadata]
 *   Optional metadata; `metadata.layout` holds responsive/styling settings (C.6.4.14).
 * @property {string} [globalBlockId] — when set, config resolves from global block storage (C.6.4.12)
 */

/**
 * @typedef {Object} PageLayoutDocument
 * @property {string} pageKey
 * @property {string} locale
 * @property {'draft'|'published'} status
 * @property {PageBlock[]} draftBlocks
 * @property {PageBlock[]} publishedBlocks
 */

let blockIdCounter = 0;

export function createBlockId(prefix = 'blk') {
  blockIdCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${blockIdCounter.toString(36)}`;
}

/**
 * @param {string} type
 * @param {Record<string, unknown>} [config]
 * @param {Partial<PageBlock>} [overrides]
 */
export function createBlock(type, config = {}, overrides = {}) {
  return {
    id: overrides.id || createBlockId(),
    type,
    order: overrides.order ?? 0,
    enabled: overrides.enabled !== false,
    config: { ...config },
    metadata: overrides.metadata || {},
  };
}

export function sortBlocks(blocks) {
  return [...(blocks || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function reindexBlocks(blocks) {
  return sortBlocks(blocks).map((block, index) => ({ ...block, order: index }));
}

/** Assign order by array position without re-sorting (for drag reorder). */
export function assignBlockOrder(blocks) {
  return (blocks || []).map((block, index) => ({ ...block, order: index }));
}

export function moveBlockUp(blocks, blockId) {
  const sorted = sortBlocks(blocks);
  const idx = sorted.findIndex((b) => b.id === blockId);
  if (idx <= 0) return blocks;
  const next = [...sorted];
  [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
  return reindexBlocks(next);
}

export function moveBlockDown(blocks, blockId) {
  const sorted = sortBlocks(blocks);
  const idx = sorted.findIndex((b) => b.id === blockId);
  if (idx < 0 || idx >= sorted.length - 1) return blocks;
  const next = [...sorted];
  [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
  return reindexBlocks(next);
}

/**
 * @param {PageBlock} block
 * @param {import('./blockRegistry.js').BlockDefinition} definition
 */
export function validateBlockConfig(block, definition) {
  /** @type {string[]} */
  const errors = [];
  if (!block?.type) errors.push('Block type is required');
  if (definition && block.type !== definition.blockType) {
    errors.push(`Block type mismatch: expected ${definition.blockType}`);
  }
  for (const field of definition?.fields || []) {
    const val = block.config?.[field.key];
    if (field.required && (val === undefined || val === null || val === '')) {
      errors.push(`${field.label} is required`);
    }
    if (field.type === 'number' && val != null && val !== '' && Number.isNaN(Number(val))) {
      errors.push(`${field.label} must be a number`);
    }
  }
  if (typeof definition?.validate === 'function') {
    const custom = definition.validate(block.config || {});
    if (Array.isArray(custom)) errors.push(...custom);
    else if (typeof custom === 'string') errors.push(custom);
  }
  return errors;
}

/**
 * @param {PageBlock[]} blocks
 * @param {Map<string, import('./blockRegistry.js').BlockDefinition>} definitionMap
 */
export function validatePageBlocks(blocks, definitionMap) {
  /** @type {string[]} */
  const errors = [];
  const ids = new Set();
  for (const block of blocks || []) {
    if (ids.has(block.id)) errors.push(`Duplicate block id: ${block.id}`);
    ids.add(block.id);
    const def = definitionMap.get(block.type);
    if (!def) {
      errors.push(`Unknown block type: ${block.type}`);
      continue;
    }
    errors.push(...validateBlockConfig(block, def).map((e) => `[${block.id}] ${e}`));
  }
  return errors;
}

export function parseJsonArray(raw, fallback = []) {
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function getDefaultConfig(definition) {
  /** @type {Record<string, unknown>} */
  const config = {};
  for (const field of definition?.fields || []) {
    if (field.defaultValue !== undefined) config[field.key] = field.defaultValue;
    else if (field.type === 'boolean') config[field.key] = false;
    else if (field.type === 'number' || field.type === 'range') config[field.key] = field.defaultValue ?? field.min ?? 0;
    else config[field.key] = '';
  }
  return config;
}
