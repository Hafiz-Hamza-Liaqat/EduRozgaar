import { ResumeTemplateCatalog } from '../models/ResumeTemplateCatalog.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listResumeTemplates = asyncHandler(async (_req, res) => {
  const templates = await ResumeTemplateCatalog.find({ status: 'active' })
    .sort({ name: 1 })
    .lean();
  res.json({ data: templates });
});
