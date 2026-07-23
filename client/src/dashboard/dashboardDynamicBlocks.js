import { createBlock } from '@shared/blockSchema.js';

/** Default dynamic blocks for dashboard dynamic-content widget — no custom listing logic. */
export const DASHBOARD_DYNAMIC_BLOCKS = [
  createBlock('featured-jobs', { limit: 4 }, { order: 0, id: 'dash_jobs' }),
  createBlock('featured-scholarships', { limit: 3 }, { order: 1, id: 'dash_scholarships' }),
  createBlock('dynamic-career', { limit: 3 }, { order: 2, id: 'dash_career' }),
  createBlock('featured-admissions', { limit: 3 }, { order: 3, id: 'dash_admissions' }),
];
