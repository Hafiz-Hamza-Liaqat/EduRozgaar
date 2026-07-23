import fs from 'fs';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  parseImportFile,
  validateImportColumns,
  formatColumnMismatchError,
  detectedColumns,
} from '../../services/importParserService.js';
import { runImport, getImportableResources } from '../../services/importHandlers.js';

export const listImportResources = asyncHandler(async (_req, res) => {
  res.json({
    resources: getImportableResources(),
    formats: ['json', 'csv', 'xlsx', 'xls'],
    note: 'Duplicates are skipped based on natural keys (e.g. title+company for jobs).',
  });
});

export const importData = asyncHandler(async (req, res) => {
  const { resource } = req.params;
  if (!getImportableResources().includes(resource)) {
    return res.status(400).json({ error: `Unknown resource: ${resource}` });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Use multipart field name "file".' });
  }

  let rows;
  try {
    rows = parseImportFile(req.file.path, req.file.originalname);
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: err.message });
  } finally {
    fs.unlink(req.file.path, () => {});
  }

  if (!rows.length) {
    return res.status(400).json({ error: 'File contains no data rows' });
  }

  const columnCheck = validateImportColumns(resource, rows);
  if (!columnCheck.ok) {
    return res.status(400).json({
      error: formatColumnMismatchError(resource, columnCheck),
      detectedColumns: columnCheck.detectedColumns,
      missingColumns: columnCheck.missing,
      hint: columnCheck.hint,
    });
  }

  const report = await runImport(resource, rows);
  res.json({
    resource,
    totalRows: rows.length,
    detectedColumns: detectedColumns(rows),
    ...report,
  });
});
