/**
 * Registry validation utilities — shared by verify script and optional runtime checks.
 */
import { PAGE_REGISTRY, getPageById } from './pageRegistry.js';
import { PLACEMENT_REGISTRY } from './placementRegistry.js';
import { PLACEMENT_TYPES } from './placementTypes.js';

/**
 * @typedef {Object} RegistryValidationResult
 * @property {boolean} ok
 * @property {string[]} errors
 * @property {string[]} warnings
 * @property {{ pages: number, placements: number, wiredSlots: number }} counts
 */

/** @param {string[]} slugResourceTypesFromServer - optional SlugService types for cross-check */
export function validateRegistries(slugResourceTypesFromServer = null) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const pageIds = new Set();
  const routes = new Map();

  for (const page of PAGE_REGISTRY) {
    if (pageIds.has(page.id)) {
      errors.push(`Duplicate page ID: ${page.id}`);
    }
    pageIds.add(page.id);

    if (page.route !== '*' && routes.has(page.route)) {
      errors.push(`Duplicate route: ${page.route} (${page.id} vs ${routes.get(page.route)})`);
    } else if (page.route !== '*') {
      routes.set(page.route, page.id);
    }

    for (const pt of page.placements) {
      if (!PLACEMENT_TYPES.includes(pt)) {
        errors.push(`Page ${page.id} references unknown placement type: ${pt}`);
      }
    }

    if (page.slugResourceType && slugResourceTypesFromServer) {
      if (!slugResourceTypesFromServer.includes(page.slugResourceType)) {
        warnings.push(
          `Page ${page.id} slugResourceType "${page.slugResourceType}" not in SlugService yet`
        );
      }
    }
  }

  const placementIds = new Set();
  const slotIds = new Set();

  for (const placement of PLACEMENT_REGISTRY) {
    if (placementIds.has(placement.id)) {
      errors.push(`Duplicate placement ID: ${placement.id}`);
    }
    placementIds.add(placement.id);

    if (slotIds.has(placement.slotId)) {
      errors.push(`Duplicate slotId: ${placement.slotId}`);
    }
    slotIds.add(placement.slotId);

    const page = getPageById(placement.pageId);
    if (!page) {
      errors.push(`Orphan placement ${placement.id}: unknown pageId "${placement.pageId}"`);
    } else if (!page.placements.includes(placement.slotType)) {
      warnings.push(
        `Placement ${placement.id} slotType "${placement.slotType}" not listed on page ${placement.pageId}`
      );
    }

    if (placement.previewRoute && page && page.route !== '*' && !page.route.includes(':')) {
      if (placement.previewRoute !== page.route && !page.route.startsWith(placement.previewRoute)) {
        warnings.push(
          `Placement ${placement.id} previewRoute "${placement.previewRoute}" differs from page route "${page.route}"`
        );
      }
    }
  }

  const wiredRequired = PLACEMENT_REGISTRY.filter(
    (p) => p.wiredInFrontend && p.componentHint !== 'CmsBanner' && p.slotType !== 'cms-section'
  ).map((p) => p.id);
  for (const id of wiredRequired) {
    const found = PLACEMENT_REGISTRY.find((p) => p.id === id || p.slotId === id);
    if (!found) {
      errors.push(`Missing required wired placement/slot: ${id}`);
    }
  }

  const adCapableWithoutPlacements = PAGE_REGISTRY.filter(
    (p) => p.adCapable && p.placements.length === 0
  );
  for (const p of adCapableWithoutPlacements) {
    warnings.push(`Ad-capable page ${p.id} has no placement types defined`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    counts: {
      pages: PAGE_REGISTRY.length,
      placements: PLACEMENT_REGISTRY.length,
      wiredSlots: PLACEMENT_REGISTRY.filter((p) => p.wiredInFrontend).length,
    },
  };
}

export function formatValidationReport(result) {
  const lines = [
    'Platform Registry Validation',
    '============================',
    '',
    `Pages:      ${result.counts.pages}`,
    `Placements: ${result.counts.placements}`,
    `Wired slots: ${result.counts.wiredSlots}`,
    '',
  ];

  if (result.errors.length) {
    lines.push(`Errors (${result.errors.length}):`);
    result.errors.forEach((e) => lines.push(`  ✗ ${e}`));
    lines.push('');
  } else {
    lines.push('Errors: none');
    lines.push('');
  }

  if (result.warnings.length) {
    lines.push(`Warnings (${result.warnings.length}):`);
    result.warnings.forEach((w) => lines.push(`  ⚠ ${w}`));
    lines.push('');
  } else {
    lines.push('Warnings: none');
    lines.push('');
  }

  lines.push(result.ok ? 'Result: PASS' : 'Result: FAIL');
  return lines.join('\n');
}
