import { Router } from 'express';
import { getInstitutions, getInstitutionBySlug, getInstitutionFilters } from '../controllers/institutionsController.js';
import { searchLimiter } from '../middleware/rateLimit.js';

export const institutionsRouter = Router();

institutionsRouter.get('/institutions/filters', searchLimiter, getInstitutionFilters);
institutionsRouter.get('/institutions', searchLimiter, getInstitutions);
institutionsRouter.get('/institutions/:slugOrId', getInstitutionBySlug);
