#!/usr/bin/env node
/**
 * Page Builder draft isolation regression checks (C.6.4.9.2)
 * Run: node scripts/verify-page-builder-draft-isolation.mjs
 */
import {
  isDraftSynced,
  layoutRequestKey,
  shouldApplyLoadResponse,
} from '../client/src/hooks/pageBuilderDraftUtils.js';

/** @type {string[]} */
const failures = [];

function assert(name, condition) {
  if (!condition) failures.push(name);
}

// layoutRequestKey
assert('layoutRequestKey trims pageKey', layoutRequestKey(' about ', 'en') === 'about:en');

// isDraftSynced
assert('synced when loaded matches selected', isDraftSynced({
  selectedPageKey: 'about',
  selectedLocale: 'en',
  loadedPageKey: 'about',
  loadedLocale: 'en',
  loading: false,
}));
assert('not synced while loading', !isDraftSynced({
  selectedPageKey: 'about',
  selectedLocale: 'en',
  loadedPageKey: 'about',
  loadedLocale: 'en',
  loading: true,
}));
assert('not synced when pageKey differs', !isDraftSynced({
  selectedPageKey: 'services',
  selectedLocale: 'en',
  loadedPageKey: 'about',
  loadedLocale: 'en',
  loading: false,
}));
assert('not synced when locale differs', !isDraftSynced({
  selectedPageKey: 'about',
  selectedLocale: 'ur',
  loadedPageKey: 'about',
  loadedLocale: 'en',
  loading: false,
}));

// shouldApplyLoadResponse — stale About response must not apply on Services
const servicesLoadKey = layoutRequestKey('services', 'en');
assert('stale response rejected when active load key changed', !shouldApplyLoadResponse({
  activeLoadKey: servicesLoadKey,
  expectedLoadKey: layoutRequestKey('about', 'en'),
  responsePageKey: 'about',
  expectedPageKey: 'about',
  aborted: false,
}));
assert('matching active load applies', shouldApplyLoadResponse({
  activeLoadKey: servicesLoadKey,
  expectedLoadKey: servicesLoadKey,
  responsePageKey: 'services',
  expectedPageKey: 'services',
  aborted: false,
}));
assert('aborted response never applies', !shouldApplyLoadResponse({
  activeLoadKey: servicesLoadKey,
  expectedLoadKey: servicesLoadKey,
  responsePageKey: 'services',
  expectedPageKey: 'services',
  aborted: true,
}));
assert('response pageKey mismatch rejected', !shouldApplyLoadResponse({
  activeLoadKey: servicesLoadKey,
  expectedLoadKey: servicesLoadKey,
  responsePageKey: 'about',
  expectedPageKey: 'services',
  aborted: false,
}));

// Pilot pages can be isolated by distinct load keys
const pilotKeys = ['about', 'services', 'privacy-policy', 'terms'];
const loadKeys = pilotKeys.map((k) => layoutRequestKey(k, 'en'));
assert('pilot load keys are unique', new Set(loadKeys).size === pilotKeys.length);

if (failures.length) {
  console.error('Page Builder draft isolation verification FAILED');
  failures.forEach((f) => console.error(`  ✗ ${f}`));
  process.exit(1);
}

console.log('Page Builder draft isolation verification PASSED');
console.log(`  Checks: ${8 + 1} scenarios`);
console.log(`  Pilot pages: ${pilotKeys.join(', ')}`);
