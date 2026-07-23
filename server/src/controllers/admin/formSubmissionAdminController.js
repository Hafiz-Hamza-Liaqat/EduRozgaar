import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  deleteFormSubmission,
  exportSubmissionsCsv,
  getFormSubmission,
  listFormSubmissions,
  updateFormSubmission,
} from '../../services/formSubmissionService.js';

function escapeCsv(val) {
  const s = String(val ?? '').replace(/"/g, '""');
  return `"${s}"`;
}

export const listSubmissions = asyncHandler(async (req, res) => {
  const result = await listFormSubmissions(req.query);
  res.json(result);
});

export const getSubmission = asyncHandler(async (req, res) => {
  const doc = await getFormSubmission(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Submission not found' });
  res.json({ submission: doc });
});

export const patchSubmission = asyncHandler(async (req, res) => {
  const doc = await updateFormSubmission(req.params.id, req.body);
  if (!doc) return res.status(404).json({ error: 'Submission not found' });
  res.json({ submission: doc });
});

export const removeSubmission = asyncHandler(async (req, res) => {
  const ok = await deleteFormSubmission(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Submission not found' });
  res.status(204).send();
});

export const exportCsv = asyncHandler(async (req, res) => {
  const rows = await exportSubmissionsCsv(req.query);
  const header = 'id,formSlug,formVersion,status,createdAt,data';
  const lines = rows.map((r) => [
    r._id,
    r.formSlug,
    r.formVersion,
    r.status,
    r.createdAt?.toISOString?.() || r.createdAt,
    JSON.stringify(r.data || {}),
  ].map(escapeCsv).join(','));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="form-submissions.csv"');
  res.send([header, ...lines].join('\n'));
});
