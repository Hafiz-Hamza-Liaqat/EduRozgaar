import { Router } from 'express';
import { getAdmissions, getAdmissionByIdOrSlug } from '../controllers/admissionsController.js';
import { saveAdmission, unsaveAdmission } from '../controllers/savedController.js';
import { requireAuth, requireUserAuth } from '../middleware/auth.js';

export const admissionsRouter = Router();

admissionsRouter.get('/admissions', getAdmissions);
admissionsRouter.get('/admissions/:idOrSlug', getAdmissionByIdOrSlug);
admissionsRouter.post('/admissions/:id/save', requireAuth, requireUserAuth, saveAdmission);
admissionsRouter.delete('/admissions/:id/save', requireAuth, requireUserAuth, unsaveAdmission);
