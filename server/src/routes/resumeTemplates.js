import { Router } from 'express';
import { listResumeTemplates } from '../controllers/resumeTemplatesController.js';

export const resumeTemplatesRouter = Router();

resumeTemplatesRouter.get('/resume-templates', listResumeTemplates);
