import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createFormDefinition,
  deleteFormDefinition,
  duplicateFormDefinition,
  getFormDefinitionByIdOrSlug,
  listFormDefinitions,
  updateFormDefinition,
} from '../../services/formService.js';
import { syncWorkflowAfterSave } from '../../services/workflow/workflowIntegration.js';
import { onContentSaved, onContentDeleted } from '../../utils/contentIntegration.js';

export const listForms = asyncHandler(async (req, res) => {
  const result = await listFormDefinitions(req.query);
  res.json(result);
});

export const getForm = asyncHandler(async (req, res) => {
  const form = await getFormDefinitionByIdOrSlug(req.params.id);
  if (!form) return res.status(404).json({ error: 'Form not found' });
  res.json({ form });
});

export const createForm = asyncHandler(async (req, res) => {
  const result = await createFormDefinition(req.body, req.user?._id);
  if (!result.ok) return res.status(400).json({ error: 'Validation failed', details: result.errors });
  await syncWorkflowAfterSave('forms', result.form).catch(() => {});
  onContentSaved('forms', result.form);
  res.status(201).json({ form: result.form });
});

export const updateForm = asyncHandler(async (req, res) => {
  const result = await updateFormDefinition(req.params.id, req.body, req.user?._id);
  if (!result.ok) {
    if (result.errors?.[0] === 'Form not found') return res.status(404).json({ error: 'Form not found' });
    return res.status(400).json({ error: 'Validation failed', details: result.errors });
  }
  await syncWorkflowAfterSave('forms', result.form).catch(() => {});
  onContentSaved('forms', result.form);
  res.json({ form: result.form });
});

export const removeForm = asyncHandler(async (req, res) => {
  const ok = await deleteFormDefinition(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Form not found' });
  onContentDeleted('forms', req.params.id);
  res.status(204).send();
});

export const duplicateForm = asyncHandler(async (req, res) => {
  const form = await duplicateFormDefinition(req.params.id, req.user?._id);
  if (!form) return res.status(404).json({ error: 'Form not found' });
  res.status(201).json({ form });
});

export const listPublishedForms = asyncHandler(async (req, res) => {
  const result = await listFormDefinitions({ ...req.query, status: 'published', limit: 200 });
  res.json({ items: result.items.map((f) => ({ _id: f._id, name: f.name, slug: f.slug, category: f.category })) });
});
