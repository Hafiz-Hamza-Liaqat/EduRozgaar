/**
 * Page Builder runtime verification (C.6.4.9).
 */
import {
  PAGE_BUILDER_PAGES,
  PILOT_PAGE_BUILDER_KEYS,
  getPageBuilderConfig,
  isPageBuilderEnabled,
} from './pageBuilderConfig.js';

/** @typedef {{ ok: boolean; errors: string[]; warnings: string[]; counts: { pilotPages: number } }} PageBuilderRuntimeValidation */

export function validatePageBuilderRuntime() {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const expectedPilot = ['about', 'services', 'privacy-policy', 'terms'];
  for (const key of expectedPilot) {
    if (!PILOT_PAGE_BUILDER_KEYS.includes(key)) {
      errors.push(`Missing pilot page key: ${key}`);
    }
    if (!isPageBuilderEnabled(key)) {
      errors.push(`Pilot page not enabled: ${key}`);
    }
    const cfg = getPageBuilderConfig(key);
    if (!cfg?.canonicalPath?.startsWith('/')) {
      errors.push(`Invalid canonicalPath for ${key}`);
    }
    if (!cfg?.legacySlug) {
      errors.push(`Missing legacySlug for ${key}`);
    }
  }

  for (const cfg of Object.values(PAGE_BUILDER_PAGES)) {
    if (cfg.usePageBuilder && cfg.pageKey !== cfg.legacySlug && !cfg.legacySlug) {
      warnings.push(`Page ${cfg.pageKey} has usePageBuilder without legacySlug mapping`);
    }
  }

  const disabled = Object.values(PAGE_BUILDER_PAGES).filter((p) => !p.usePageBuilder);
  if (disabled.length) {
    warnings.push(`${disabled.length} page(s) registered with usePageBuilder: false`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    counts: { pilotPages: PILOT_PAGE_BUILDER_KEYS.length },
  };
}

export function formatPageBuilderRuntimeReport(result) {
  const lines = [
    '=== Page Builder Runtime (C.6.4.9) ===',
    `Pilot pages enabled: ${result.counts.pilotPages}`,
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
