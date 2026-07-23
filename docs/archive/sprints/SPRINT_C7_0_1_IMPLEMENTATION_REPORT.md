# Sprint C.7.0.1 — Media Library Foundation

**Status:** Implemented  
**Date:** July 2026  
**Milestone:** C.7.0 — Media Library & DAM (foundation sprint)

## Summary

Introduced a centralized Media Library with a canonical `MediaAsset` model, pluggable storage providers, admin UI, image variant generation, asset picker integration across editors, usage tracking, and deletion guards.

## Goals Delivered

| Goal | Status |
|------|--------|
| Canonical media model | ✅ `MediaAsset` MongoDB schema |
| Storage abstraction | ✅ Local + Supabase/S3 stubs |
| Admin Media Library UI | ✅ `/admin/media` |
| Upload (drag-drop, multi, progress, retry, cancel) | ✅ |
| Duplicate detection (checksum) | ✅ SHA-256 on upload |
| Image variants (thumb/medium/large/original) | ✅ via `sharp` + WebP |
| Asset picker in image fields | ✅ Page builder + `AdminImageUrlField` |
| Metadata editing | ✅ Alt, caption, credit, copyright, etc. |
| Usage tracking | ✅ Cross-content scan |
| Delete protection when in use | ✅ 409 + usage list |
| Verification script | ✅ `npm run verify:media-library` |

## Architecture

### Asset Model (`server/src/models/MediaAsset.js`)

Stores: filename, original filename, mime type, dimensions, file size, alt text, caption, folder, tags, uploaded by, checksum, storage provider/key/URL, thumbnail/medium/large URLs, variants map, and extended metadata (credit, copyright, photographer, license, description).

### Storage Providers (`server/src/storage/`)

| Provider | File | Behavior |
|----------|------|----------|
| `local` | `LocalStorageProvider.js` | Default — writes to `server/uploads/` |
| `supabase` | `SupabaseStorageProvider.js` | Stub — ready for env wiring |
| `s3` | `S3StorageProvider.js` | Future stub |

Selected via `MEDIA_STORAGE_PROVIDER` (falls back to local if provider not configured).

### Image Processing (`server/src/services/mediaImageProcessor.js`)

Uses `sharp` to generate WebP variants at 320px, 800px, and 1600px widths (without enlargement), plus original file. Variant URLs are stored on the asset document.

### API Routes (`/api/admin/media`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/media` | List with search, folder, sort, pagination |
| GET | `/media/folders` | Distinct folders |
| POST | `/media/upload` | Multi-file upload |
| GET | `/media/:id` | Asset + usage |
| GET | `/media/:id/usage` | Usage only |
| PATCH | `/media/:id` | Update metadata |
| POST | `/media/:id/rename` | Rename display filename |
| DELETE | `/media/:id` | Delete (blocked if in use) |

Permission: `content:site` (Editor+ with site CMS access).

### Usage Tracking (`server/src/services/mediaUsageService.js`)

Scans references by URL across:

- Page layouts (draft + published blocks, OG image)
- Global blocks
- Homepage CMS
- Static CMS pages & banners
- Navigation items
- Blogs, advertisements
- Jobs, scholarships, universities, companies, career articles

### Client

| Component | Purpose |
|-----------|---------|
| `AdminMediaLibrary.jsx` | Full library page (grid/list, filters, detail panel) |
| `MediaAssetPicker.jsx` | Modal picker for editors |
| `MediaLibraryParts.jsx` | Upload dropzone + detail/metadata panel |
| `AdminImageUrlField.jsx` | Added **Media Library** button |

**Picker integrated in:**

- All `AdminImageUrlField` usages (blogs, CMS, ads, etc.)
- Page builder `BlockConfigFields` (URL image fields)
- `RepeaterFieldEditors` (gallery, feature cards)
- `BlockInspector` (background image)

URLs remain strings in content — **backward compatible** with existing pages.

## Verification

```bash
npm run verify:media-library
```

Checks: shared helpers, storage providers, model fields, routes, client integration, sharp dependency, nav/route wiring.

## Configuration

See `.env.template`:

```env
MEDIA_STORAGE_PROVIDER=local
```

Optional Supabase/S3 variables documented for future activation.

## Roadmap (Next Sprints)

| Sprint | Focus |
|--------|-------|
| C.7.0.2 | Forms Builder |
| C.7.0.3 | Dynamic Content Blocks |
| C.7.0.4 | Global Search & Indexing |
| C.7.0.5 | Analytics & Insights |

## Follow-ups (Optional)

- Wire Supabase/S3 providers for production object storage
- Store `mediaAssetId` alongside URLs for stronger reference tracking
- AVIF variant generation when browser support policy is defined
- Bulk folder operations and asset move/rename at storage key level
