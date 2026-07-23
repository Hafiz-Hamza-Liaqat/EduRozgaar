/**
 * Block registry validation — shared by verify script (C.6.4.8).
 */
import {
  BLOCK_REGISTRY,
  REQUIRED_BLOCK_TYPES,
  getBlockDefinitionMap,
} from './blockRegistry.js';

const REQUIRED_DEF_FIELDS = ['blockType', 'displayName', 'icon', 'category', 'fields', 'rendererKey', 'supportsPreview'];

/**
 * @param {string[]} clientRendererKeys - from client blockComponentMap
 * @returns {{ ok: boolean; errors: string[]; warnings: string[]; counts: { blocks: number; renderers: number } }}
 */
export function validateBlockRegistry(clientRendererKeys = []) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const types = new Set();
  const rendererKeys = new Set();
  const clientSet = new Set(clientRendererKeys);

  for (const def of BLOCK_REGISTRY) {
    for (const key of REQUIRED_DEF_FIELDS) {
      if (def[key] === undefined || def[key] === null || def[key] === '') {
        errors.push(`Block ${def.blockType || '?'} missing field: ${key}`);
      }
    }
    if (types.has(def.blockType)) errors.push(`Duplicate blockType: ${def.blockType}`);
    types.add(def.blockType);

    if (rendererKeys.has(def.rendererKey)) errors.push(`Duplicate rendererKey: ${def.rendererKey}`);
    rendererKeys.add(def.rendererKey);

    if (!Array.isArray(def.fields)) errors.push(`Block ${def.blockType}: fields must be an array`);
    if (def.supportsPreview !== true) warnings.push(`Block ${def.blockType}: supportsPreview is not true`);

    if (clientRendererKeys.length && !clientSet.has(def.rendererKey)) {
      errors.push(`Missing client renderer for ${def.rendererKey} (${def.blockType})`);
    }
  }

  for (const required of REQUIRED_BLOCK_TYPES) {
    if (!types.has(required)) errors.push(`Missing required block type: ${required}`);
  }

  for (const key of clientRendererKeys) {
    const match = BLOCK_REGISTRY.find((b) => b.rendererKey === key);
    if (!match) warnings.push(`Client renderer ${key} has no registry definition`);
  }

  const map = getBlockDefinitionMap();
  if (map.size !== BLOCK_REGISTRY.length) {
    errors.push('Block definition map size mismatch');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    counts: {
      blocks: BLOCK_REGISTRY.length,
      renderers: clientRendererKeys.length || rendererKeys.size,
    },
  };
}

export function extractRendererKeysFromMapSource(source) {
  const keys = new Set();
  const re = /^\s*([A-Za-z][A-Za-z0-9]*Block)\s*,?\s*$/gm;
  let match;
  while ((match = re.exec(source)) !== null) {
    keys.add(match[1]);
  }
  return [...keys];
}

export function formatBlockRegistryReport(result) {
  const lines = [
    '=== Block Registry Verification (C.6.4.8) ===',
    `Blocks: ${result.counts.blocks} | Client renderers: ${result.counts.renderers}`,
    result.ok ? 'Status: PASS' : 'Status: FAIL',
  ];
  if (result.errors.length) {
    lines.push('', 'Errors:');
    result.errors.forEach((e) => lines.push(`  ✗ ${e}`));
  }
  if (result.warnings.length) {
    lines.push('', 'Warnings:');
    result.warnings.forEach((w) => lines.push(`  ⚠ ${w}`));
  }
  return lines.join('\n');
}
