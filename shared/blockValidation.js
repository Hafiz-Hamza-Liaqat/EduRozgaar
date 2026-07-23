/**
 * Page Builder block validation with error / warning / valid states (C.6.4.10+).
 */
import { getBlockDefinition } from './blockRegistry.js';
import { validateBlockConfig } from './blockSchema.js';
import { resolveBlockForValidation } from './pageBuilderGlobalBlocks.js';
import { getBlockLayoutSettings, validateBlockLayoutSettings } from './pageBuilderLayout.js';
import { auditPageAccessibility } from './pageBuilderAccessibility.js';

/** @typedef {'valid'|'warning'|'error'} BlockValidationStatus */

/**
 * @typedef {Object} BlockValidationResult
 * @property {BlockValidationStatus} status
 * @property {string[]} errors
 * @property {string[]} warnings
 */

/**
 * @param {import('./blockSchema.js').PageBlock} block
 * @param {import('./blockRegistry.js').BlockDefinition} [definition]
 * @param {Map<string, object>} [globalMap]
 * @returns {BlockValidationResult}
 */
export function getBlockValidation(block, definition, globalMap) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (block?.globalBlockId) {
    const global = globalMap?.get(String(block.globalBlockId));
    if (!global) errors.push('Global block not found');
    else if (global.enabled === false) errors.push(`Global block "${global.name || block.globalBlockId}" is disabled`);
    else {
      const resolved = resolveBlockForValidation(block, globalMap);
      definition = getBlockDefinition(resolved.type);
      block = resolved;
    }
  }

  if (!errors.length) {
    if (definition) errors.push(...validateBlockConfig(block, definition));
    else errors.push('Unknown block type');
  }

  const layoutResult = validateBlockLayoutSettings(getBlockLayoutSettings(block), block?.type || '');
  errors.push(...layoutResult.errors);
  warnings.push(...layoutResult.warnings);

  if (definition && typeof definition.getWarnings === 'function' && block && !block.globalBlockId) {
    const custom = definition.getWarnings(block.config || {});
    if (Array.isArray(custom)) warnings.push(...custom);
    else if (typeof custom === 'string') warnings.push(custom);
  } else if (definition && block?.globalBlockId && globalMap) {
    const resolved = resolveBlockForValidation(block, globalMap);
    if (typeof definition.getWarnings === 'function') {
      const custom = definition.getWarnings(resolved.config || {});
      if (Array.isArray(custom)) warnings.push(...custom);
    }
  }

  /** @type {BlockValidationStatus} */
  let status = 'valid';
  if (errors.length) status = 'error';
  else if (warnings.length) status = 'warning';

  return { status, errors, warnings };
}

/**
 * @param {import('./blockSchema.js').PageBlock[]} blocks
 * @param {{ includeDisabled?: boolean; globalMap?: Map<string, object> }} [options]
 */
export function getPageValidationSummary(blocks, options = {}) {
  const includeDisabled = options.includeDisabled === true;
  const globalMap = options.globalMap;
  /** @type {BlockValidationResult[]} */
  const blockResults = [];
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  for (const block of blocks || []) {
    if (!includeDisabled && block.enabled === false) continue;
    const def = getBlockDefinition(block.type);
    const result = getBlockValidation(block, def, globalMap);
    blockResults.push(result);
    const label = block.globalBlockId
      ? `Global: ${globalMap?.get(String(block.globalBlockId))?.name || block.globalBlockId}`
      : (def?.displayName || block.type);
    for (const e of result.errors) errors.push(`${label} (#${(block.order ?? 0) + 1}): ${e}`);
    for (const w of result.warnings) warnings.push(`${label} (#${(block.order ?? 0) + 1}): ${w}`);
  }

  const a11y = auditPageAccessibility(blocks);
  errors.push(...a11y.errors);
  warnings.push(...a11y.warnings);

  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  return {
    ok: !hasErrors,
    canPublish: !hasErrors,
    errors,
    warnings,
    blockResults,
    invalidCount: blockResults.filter((r) => r.status === 'error').length,
    warningCount: blockResults.filter((r) => r.status === 'warning').length,
  };
}

export { parseJsonArray } from './blockSchema.js';
