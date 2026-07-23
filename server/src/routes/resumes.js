import { Router } from 'express';
import { requireAuth, requireUserAuth } from '../middleware/auth.js';
import {
  createResume,
  getMyResumes,
  getResumeById,
  updateResume,
  deleteResume,
  aiSuggest,
  optimizeForJob,
} from '../controllers/resumesController.js';

export const resumesRouter = Router();

resumesRouter.post('/resumes', requireAuth, requireUserAuth, createResume);
resumesRouter.get('/resumes/user', requireAuth, requireUserAuth, getMyResumes);
resumesRouter.post('/resumes/ai-suggest', requireAuth, requireUserAuth, aiSuggest);
resumesRouter.post('/resumes/optimize-for-job', requireAuth, requireUserAuth, optimizeForJob);
resumesRouter.get('/resumes/:id', requireAuth, requireUserAuth, getResumeById);
resumesRouter.put('/resumes/:id', requireAuth, requireUserAuth, updateResume);
resumesRouter.delete('/resumes/:id', requireAuth, requireUserAuth, deleteResume);
