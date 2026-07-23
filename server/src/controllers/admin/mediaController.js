import {
  deleteMediaAsset,
  getMediaAssetById,
  listMediaAssets,
  listMediaFolders,
  updateMediaAsset,
  uploadMediaAsset,
} from '../../services/mediaService.js';
import { findMediaAssetUsage } from '../../services/mediaUsageService.js';
import { syncWorkflowAfterSave } from '../../services/workflow/workflowIntegration.js';
import { onContentSaved, onContentDeleted } from '../../utils/contentIntegration.js';

export async function listAssets(req, res) {
  try {
    const result = await listMediaAssets(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to list media assets' });
  }
}

export async function listFolders(req, res) {
  try {
    const folders = await listMediaFolders();
    res.json({ folders });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to list folders' });
  }
}

export async function getAsset(req, res) {
  try {
    const asset = await getMediaAssetById(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    const usage = await findMediaAssetUsage(asset);
    res.json({ asset, usage });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to get asset' });
  }
}

export async function getAssetUsage(req, res) {
  try {
    const asset = await getMediaAssetById(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    const usage = await findMediaAssetUsage(asset);
    res.json({ usage });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to get usage' });
  }
}

export async function uploadAssets(req, res) {
  try {
    const files = req.files?.length ? req.files : (req.file ? [req.file] : []);
    if (!files.length) return res.status(400).json({ error: 'No files uploaded' });

    const folder = req.body?.folder || 'general';
    const allowDuplicate = req.body?.allowDuplicate === 'true' || req.body?.allowDuplicate === true;

    /** @type {object[]} */
    const results = [];
    for (const file of files) {
      const result = await uploadMediaAsset({
        file,
        folder,
        altText: req.body?.altText || '',
        uploadedBy: req.user?._id,
        allowDuplicate,
      });
      results.push(result);
      if (result.asset?._id) onContentSaved('media', result.asset);
    }

    const duplicates = results.filter((r) => r.duplicate);
    if (duplicates.length === results.length && results.length === 1) {
      return res.status(409).json({
        duplicate: true,
        asset: duplicates[0].asset,
        message: 'Duplicate file detected (checksum match)',
      });
    }

    res.status(201).json({
      results,
      uploaded: results.filter((r) => !r.duplicate).map((r) => r.asset),
      duplicates: duplicates.map((r) => r.asset),
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Upload failed' });
  }
}

export async function patchAsset(req, res) {
  try {
    const asset = await updateMediaAsset(req.params.id, req.body);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    onContentSaved('media', asset);
    await syncWorkflowAfterSave('media', asset).catch(() => {});
    res.json({ asset });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Update failed' });
  }
}

export async function removeAsset(req, res) {
  try {
    const force = req.query.force === 'true';
    const result = await deleteMediaAsset(req.params.id, { force });
    if (result.reason === 'NOT_FOUND') return res.status(404).json({ error: 'Asset not found' });
    if (result.reason === 'IN_USE') {
      return res.status(409).json({
        error: 'Asset is in use and cannot be deleted',
        usage: result.usage,
      });
    }
    onContentDeleted('media', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Delete failed' });
  }
}

export async function renameAsset(req, res) {
  try {
    const { filename } = req.body || {};
    if (!filename?.trim()) return res.status(400).json({ error: 'filename is required' });
    const asset = await updateMediaAsset(req.params.id, { filename: filename.trim() });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json({ asset });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Rename failed' });
  }
}
