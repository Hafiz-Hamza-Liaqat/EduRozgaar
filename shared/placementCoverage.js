/**
 * Placement coverage validation — AdHost wiring vs registry (C.6.4.7).
 */
import { PLACEMENT_REGISTRY, getSelectableAdPlacementsForPage } from './placementRegistry.js';
import { getPageById } from './pageRegistry.js';

/** componentHint values that are not rendered via AdHost */
export const NON_ADHOST_HINTS = new Set(['CmsBanner', 'HomeSection']);

/**
 * @param {string} filePath
 * @param {string} source
 * @returns {Map<string, string[]>} placementId → file paths
 */
export function extractAdHostPlacementsFromSource(filePath, source) {
  /** @type {Map<string, string[]>} */
  const found = new Map();
  const patterns = [
    /placementId=["']([a-z0-9-]+)["']/g,
    /placementId=\{["']([a-z0-9-]+)["']\}/g,
  ];
  if (!source.includes('AdHost')) return found;

  for (const re of patterns) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(source)) !== null) {
      const id = match[1];
      const list = found.get(id) || [];
      if (!list.includes(filePath)) list.push(filePath);
      found.set(id, list);
    }
  }
  return found;
}

export function mergeAdHostScanMaps(maps) {
  /** @type {Map<string, string[]>} */
  const merged = new Map();
  for (const map of maps) {
    for (const [id, files] of map.entries()) {
      const list = merged.get(id) || [];
      for (const f of files) {
        if (!list.includes(f)) list.push(f);
      }
      merged.set(id, list);
    }
  }
  return merged;
}

function isAdPlacement(placement) {
  return (placement.supportsAdsense || placement.supportsImageAds)
    && !NON_ADHOST_HINTS.has(placement.componentHint)
    && placement.slotType !== 'cms-section';
}

function isCmsBannerPlacement(placement) {
  return placement.componentHint === 'CmsBanner';
}

/**
 * @param {Map<string, string[]>} adHostByPlacement
 * @param {{ cmsBannerFiles?: string[] }} [options]
 */
export function validatePlacementCoverage(adHostByPlacement, options = {}) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const registryIds = new Set(PLACEMENT_REGISTRY.map((p) => p.id));
  const wiredAdHost = PLACEMENT_REGISTRY.filter(
    (p) => p.wiredInFrontend && isAdPlacement(p)
  );
  const wiredCmsBanner = PLACEMENT_REGISTRY.filter(
    (p) => p.wiredInFrontend && isCmsBannerPlacement(p)
  );
  const plannedAd = PLACEMENT_REGISTRY.filter(
    (p) => p.planned && isAdPlacement(p)
  );

  for (const placement of wiredAdHost) {
    if (!adHostByPlacement.has(placement.id)) {
      errors.push(
        `Wired placement "${placement.id}" has no AdHost in client (expected on ${placement.previewRoute})`
      );
    }
    const page = getPageById(placement.pageId);
    if (!page) {
      errors.push(`Wired placement "${placement.id}" references unknown pageId "${placement.pageId}"`);
    }
  }

  for (const placement of wiredCmsBanner) {
    const cmsFiles = options.cmsBannerFiles || [];
    if (!cmsFiles.some((f) => /Home\.jsx$/i.test(f))) {
      warnings.push(
        `CMS banner placement "${placement.id}" — verify Home.jsx renders CMS banners`
      );
    }
  }

  for (const [placementId, files] of adHostByPlacement.entries()) {
    if (!registryIds.has(placementId)) {
      errors.push(`Orphan AdHost: placementId "${placementId}" not in registry (in ${files.join(', ')})`);
      continue;
    }
    const placement = PLACEMENT_REGISTRY.find((p) => p.id === placementId);
    if (placement && !placement.wiredInFrontend && isAdPlacement(placement) && !placement.planned) {
      errors.push(
        `AdHost "${placementId}" in code but registry wiredInFrontend=false (${files.join(', ')})`
      );
    }
  }

  for (const placement of PLACEMENT_REGISTRY.filter((p) => isAdPlacement(p))) {
    if (!placement.wiredInFrontend && !placement.planned) {
      const selectable = getSelectableAdPlacementsForPage(placement.pageId)
        .some((p) => p.id === placement.id);
      if (selectable) {
        errors.push(`Dead admin mapping: "${placement.id}" is admin-selectable but not wired`);
      }
    }
    if (placement.wiredInFrontend && placement.planned) {
      errors.push(`Invalid state: "${placement.id}" is both wired and planned`);
    }
  }

  for (const placement of plannedAd) {
    if (adHostByPlacement.has(placement.id)) {
      errors.push(`Planned placement "${placement.id}" should not have AdHost until layout exists`);
    }
  }

  const selectableIds = new Set();
  for (const placement of PLACEMENT_REGISTRY) {
    const page = getPageById(placement.pageId);
    if (!page?.adCapable) continue;
    for (const p of getSelectableAdPlacementsForPage(placement.pageId)) {
      selectableIds.add(p.id);
    }
  }
  for (const id of selectableIds) {
    const p = PLACEMENT_REGISTRY.find((x) => x.id === id);
    if (!p?.wiredInFrontend) {
      errors.push(`Admin-selectable placement "${id}" is not wiredInFrontend`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    counts: {
      registryPlacements: PLACEMENT_REGISTRY.length,
      wiredAdHost: wiredAdHost.length,
      wiredCmsBanner: wiredCmsBanner.length,
      plannedAd: plannedAd.length,
      adHostInCode: adHostByPlacement.size,
      adminSelectable: selectableIds.size,
    },
  };
}

export function formatCoverageReport(result) {
  const lines = [
    'Placement Coverage Validation (C.6.4.7)',
    '======================================',
    '',
    `Registry placements:     ${result.counts.registryPlacements}`,
    `Wired AdHost:            ${result.counts.wiredAdHost}`,
    `Wired CMS banner:        ${result.counts.wiredCmsBanner}`,
    `Planned (not wired):     ${result.counts.plannedAd}`,
    `AdHost in client code:   ${result.counts.adHostInCode}`,
    `Admin-selectable:        ${result.counts.adminSelectable}`,
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
