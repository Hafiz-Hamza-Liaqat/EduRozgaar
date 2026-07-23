#!/usr/bin/env node
/**
 * Sprint C.6.4.6 — Ad impression/click tracking verification
 * Run: node scripts/verify-ad-tracking.mjs
 * Optional: API_BASE=http://localhost:5000/api
 */
import { connectDB } from '../server/src/config/db.js';
import { AdSlotConfig } from '../server/src/models/AdSlotConfig.js';
import {
  calculateCtr,
  formatCtr,
  isSlotWithinLimits,
  isWithinClickLimit,
  isWithinImpressionLimit,
} from '../server/src/utils/adSlotLimits.js';

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';
const TEST_SLOT = `verify-ad-tracking-${Date.now()}`;

let passed = 0;
let failed = 0;

function ok(name) {
  passed += 1;
  console.log(`  ✓ ${name}`);
}

function fail(name, detail) {
  failed += 1;
  console.error(`  ✗ ${name}${detail ? `: ${detail}` : ''}`);
}

function testCtr() {
  if (calculateCtr(124, 1000) === 12.4) ok('CTR calculation');
  else fail('CTR calculation', String(calculateCtr(124, 1000)));

  if (formatCtr(124, 1000) === '12.40%') ok('CTR formatting');
  else fail('CTR formatting', formatCtr(124, 1000));

  if (formatCtr(0, 0) === '—') ok('CTR zero impressions');
  else fail('CTR zero impressions', formatCtr(0, 0));
}

function testLimits() {
  const slot = { impressionCount: 5, impressionLimit: 5, clickCount: 2, clickLimit: 10 };
  if (!isWithinImpressionLimit(slot)) ok('impression limit reached');
  else fail('impression limit reached');

  if (isWithinClickLimit(slot)) ok('click limit not reached');
  else fail('click limit not reached');

  if (!isSlotWithinLimits(slot)) ok('slot excluded when impression limit reached');
  else fail('slot excluded when impression limit reached');

  const clickExhausted = { impressionCount: 1, impressionLimit: 100, clickCount: 3, clickLimit: 3 };
  if (!isSlotWithinLimits(clickExhausted)) ok('slot excluded when click limit reached');
  else fail('slot excluded when click limit reached');
}

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function testEndpoints(docId) {
  const imp = await postJson('/monetization/impression', {
    slotId: TEST_SLOT,
    placementId: 'blog-header',
    pageId: 'blog-list',
  });
  if (imp.status === 200 && imp.data.success) ok('impression endpoint');
  else fail('impression endpoint', `${imp.status} ${JSON.stringify(imp.data)}`);

  const updated = await AdSlotConfig.findById(docId).lean();
  if ((updated?.impressionCount ?? 0) >= 1) ok('impression counter increment');
  else fail('impression counter increment', String(updated?.impressionCount));

  const clk = await postJson('/monetization/click', {
    slotId: TEST_SLOT,
    placementId: 'blog-header',
    pageId: 'blog-list',
  });
  if (clk.status === 200 && clk.data.success) ok('click endpoint');
  else fail('click endpoint', `${clk.status} ${JSON.stringify(clk.data)}`);

  const afterClick = await AdSlotConfig.findById(docId).lean();
  if ((afterClick?.clickCount ?? 0) >= 1) ok('click counter increment');
  else fail('click counter increment', String(afterClick?.clickCount));
}

async function testLimitEnforcement(docId) {
  await AdSlotConfig.findByIdAndUpdate(docId, {
    impressionCount: 2,
    impressionLimit: 2,
    clickCount: 0,
    clickLimit: null,
    active: true,
    status: 'active',
  });

  const blocked = await postJson('/monetization/impression', { slotId: TEST_SLOT });
  if (blocked.status === 404) ok('impression blocked at limit');
  else fail('impression blocked at limit', String(blocked.status));

  const slot = await AdSlotConfig.findById(docId).lean();
  if (!isSlotWithinLimits(slot)) ok('limits respected for public render filter');
  else fail('limits respected for public render filter');
}

async function testPreviewExclusion() {
  try {
    const fs = await import('fs/promises');
    const src = await fs.readFile(new URL('../client/src/utils/adTracking.js', import.meta.url), 'utf8');
    if (src.includes('options.preview') && src.includes('if (options.preview')) ok('preview excluded from tracking (client)');
    else fail('preview excluded from tracking (client)');
  } catch (e) {
    fail('preview excluded from tracking (client)', e.message);
  }
}

async function main() {
  console.log('Sprint C.6.4.6 — Ad tracking verification\n');

  testCtr();
  testLimits();

  await connectDB();

  const doc = await AdSlotConfig.create({
    slotId: TEST_SLOT,
    name: 'Verify Tracking Test',
    placement: 'header',
    active: true,
    status: 'active',
    impressionCount: 0,
    clickCount: 0,
    imageUrl: 'https://example.com/ad.png',
  });

  try {
    await testEndpoints(doc._id);
    await testLimitEnforcement(doc._id);
  } finally {
    await AdSlotConfig.findByIdAndDelete(doc._id);
  }

  await testPreviewExclusion();

  console.log('\n============================');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(failed ? 'Result: FAIL' : 'Result: PASS');
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
