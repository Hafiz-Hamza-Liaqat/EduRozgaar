#!/usr/bin/env node
/**
 * Media Library foundation verification (C.7.0.1)
 */
import { readFileSync, existsSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  MEDIA_VARIANTS,
  MEDIA_VARIANT_WIDTHS,
  isMediaPickerField,
  isDuplicateChecksum,
} from '../shared/mediaLibrary.js';
import { getStorageProvider } from '../server/src/storage/index.js';
import { computeChecksum } from '../server/src/services/mediaImageProcessor.js';
import { buildMediaListQuery, buildMediaListOptions } from '../server/src/services/mediaService.js';
import { collectAssetReferenceUrls } from '../server/src/services/mediaUsageService.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const clientSrc = join(root, 'client', 'src');

/** @type {string[]} */
const failures = [];
let passed = 0;

function pass(name) { passed += 1; }
function fail(name, detail) { failures.push(`${name}${detail ? `: ${detail}` : ''}`); }
function read(rel) { return readFileSync(join(root, rel), 'utf8'); }
function exists(rel) { return docExists(root, rel); }

// Shared module
{
  if (MEDIA_VARIANTS.length === 4) pass('media variants');
  else fail('media variants');
  if (MEDIA_VARIANT_WIDTHS.thumbnail === 320) pass('thumbnail width');
  else fail('thumbnail width');
  if (isMediaPickerField({ type: 'url', key: 'backgroundImageUrl' })) pass('isMediaPickerField image');
  else fail('isMediaPickerField image');
  if (!isMediaPickerField({ type: 'url', key: 'linkUrl' })) pass('isMediaPickerField excludes link');
  else fail('isMediaPickerField excludes link');
  if (isDuplicateChecksum('abc', 'abc')) pass('duplicate checksum');
  else fail('duplicate checksum');
}

// Storage abstraction
{
  const local = getStorageProvider('local');
  if (local.name === 'local' && local.isConfigured()) pass('local storage provider');
  else fail('local storage provider');
  const supa = getStorageProvider('supabase');
  if (supa.name === 'supabase') pass('supabase storage provider');
  else fail('supabase storage provider');
  const s3 = getStorageProvider('s3');
  if (s3.name === 's3') pass('s3 storage provider stub');
  else fail('s3 storage provider stub');
}

// Checksum
{
  const hash = computeChecksum(Buffer.from('test-image'));
  if (hash.length === 64) pass('sha256 checksum');
  else fail('sha256 checksum');
}

// List query builder
{
  const q = buildMediaListQuery({ search: 'hero', folder: 'general' });
  if (q.folder === 'general' && q.$or) pass('media list query');
  else fail('media list query');
  const opts = buildMediaListOptions({ page: 2, limit: 24 });
  if (opts.skip === 24) pass('media pagination');
  else fail('media pagination');
}

// Usage URL collection
{
  const urls = collectAssetReferenceUrls({
    storageUrl: 'https://x.com/a.jpg',
    thumbnailUrl: 'https://x.com/t.jpg',
    variants: { original: 'https://x.com/a.jpg' },
  });
  if (urls.length >= 2) pass('usage url collection');
  else fail('usage url collection');
}

// Server files
const serverFiles = [
  'server/src/models/MediaAsset.js',
  'server/src/services/mediaService.js',
  'server/src/services/mediaUsageService.js',
  'server/src/services/mediaImageProcessor.js',
  'server/src/controllers/admin/mediaController.js',
  'server/src/middleware/mediaUpload.js',
  'server/src/storage/LocalStorageProvider.js',
  'server/src/storage/SupabaseStorageProvider.js',
  'server/src/storage/S3StorageProvider.js',
];
for (const f of serverFiles) {
  if (exists(f)) pass(`file ${f.split('/').pop()}`);
  else fail(`missing ${f}`);
}

// MediaAsset schema fields
{
  const model = read('server/src/models/MediaAsset.js');
  for (const field of ['checksum', 'storageUrl', 'thumbnailUrl', 'altText', 'caption', 'folder', 'tags', 'metadata']) {
    if (model.includes(field)) pass(`model field ${field}`);
    else fail(`model field ${field}`);
  }
}

// Admin routes
{
  const routes = read('server/src/routes/admin.js');
  if (routes.includes("adminRouter.get('/media'") && routes.includes("adminRouter.post('/media/upload'")) pass('admin media routes');
  else fail('admin media routes');
}

// Client files
const clientFiles = [
  'client/src/pages/Admin/AdminMediaLibrary.jsx',
  'client/src/components/media/MediaAssetPicker.jsx',
  'client/src/components/media/MediaLibraryParts.jsx',
];
for (const f of clientFiles) {
  if (exists(f)) pass(`client ${f.split('/').pop()}`);
  else fail(`missing ${f}`);
}

// AdminImageUrlField integration
{
  const field = readFileSync(join(clientSrc, 'components/admin/AdminImageUrlField.jsx'), 'utf8');
  if (field.includes('MediaAssetPicker') && field.includes('Media Library')) pass('image field picker');
  else fail('image field picker');
}

// BlockConfigFields integration
{
  const cfg = readFileSync(join(clientSrc, 'components/pageBuilder/BlockConfigFields.jsx'), 'utf8');
  if (cfg.includes('isMediaPickerField')) pass('block config media fields');
  else fail('block config media fields');
}

// Repeater editors
{
  const rep = readFileSync(join(clientSrc, 'components/pageBuilder/editors/RepeaterFieldEditors.jsx'), 'utf8');
  if (rep.includes('ImageUrlField')) pass('repeater image picker');
  else fail('repeater image picker');
}

// API client
{
  const api = read('client/src/services/adminContentApi.js');
  if (api.includes('listMediaAssets') && api.includes('deleteMediaAsset')) pass('adminContentApi media');
  else fail('adminContentApi media');
}

// Nav + route
{
  if (read('client/src/config/adminNavConfig.js').includes('/media')) pass('admin nav media');
  else fail('admin nav media');
  if (read('client/src/routes/index.jsx').includes('AdminMediaLibrary')) pass('admin route media');
  else fail('admin route media');
}

// package.json script
{
  const pkg = read('package.json');
  if (pkg.includes('verify:media-library')) pass('npm script');
  else fail('npm script');
}

// sharp dependency
{
  const serverPkg = read('server/package.json');
  if (serverPkg.includes('"sharp"')) pass('sharp dependency');
  else fail('sharp dependency');
}

console.log(`\nMedia Library verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.error(`  ✗ ${f}`));
  process.exit(1);
}
console.log('All checks passed.');
process.exit(0);
