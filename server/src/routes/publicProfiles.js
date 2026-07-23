import { Router } from 'express';
import {
  getEmployerProfile,
  getCompanyProfile,
  getUniversityProfile,
  listCompanies,
  listUniversities,
} from '../controllers/publicProfileController.js';

export const publicProfilesRouter = Router();

publicProfilesRouter.get('/employers/profile/:slug', getEmployerProfile);
publicProfilesRouter.get('/companies', listCompanies);
publicProfilesRouter.get('/companies/:slug', getCompanyProfile);
publicProfilesRouter.get('/universities', listUniversities);
publicProfilesRouter.get('/universities/:slug', getUniversityProfile);
