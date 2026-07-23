import { Router } from 'express';
import { requireAuth, requireEmployerAuth } from '../middleware/auth.js';
import {
  requireEmployerIntelligenceEnabled,
  getIntelligenceDashboard,
  listCandidates,
  getCandidateDetail,
  getPipeline,
  transitionPipeline,
  addNote,
  scheduleInterview,
  completeInterview,
  listSavedFilters,
  saveFilter,
  deleteSavedFilter,
  getRankingWeights,
  getTimelineViewer,
  getDocumentViewer,
  getCredentialViewer,
  compareCandidates,
} from '../controllers/career/employerIntelligenceController.js';

export const employerIntelligenceRouter = Router();

const auth = [requireAuth, requireEmployerAuth, requireEmployerIntelligenceEnabled];

employerIntelligenceRouter.get('/employer/intelligence/dashboard', ...auth, getIntelligenceDashboard);
employerIntelligenceRouter.get('/employer/intelligence/candidates', ...auth, listCandidates);
employerIntelligenceRouter.get('/employer/intelligence/candidates/:id', ...auth, getCandidateDetail);
employerIntelligenceRouter.get('/employer/intelligence/pipeline', ...auth, getPipeline);
employerIntelligenceRouter.post('/employer/intelligence/candidates/:id/stage', ...auth, transitionPipeline);
employerIntelligenceRouter.post('/employer/intelligence/candidates/:id/notes', ...auth, addNote);
employerIntelligenceRouter.put('/employer/intelligence/candidates/:id/interview', ...auth, scheduleInterview);
employerIntelligenceRouter.post('/employer/intelligence/candidates/:id/interview/complete', ...auth, completeInterview);
employerIntelligenceRouter.get('/employer/intelligence/saved-filters', ...auth, listSavedFilters);
employerIntelligenceRouter.post('/employer/intelligence/saved-filters', ...auth, saveFilter);
employerIntelligenceRouter.delete('/employer/intelligence/saved-filters/:id', ...auth, deleteSavedFilter);
employerIntelligenceRouter.get('/employer/intelligence/ranking/weights', ...auth, getRankingWeights);
employerIntelligenceRouter.get('/employer/intelligence/candidates/:id/timeline', ...auth, getTimelineViewer);
employerIntelligenceRouter.get('/employer/intelligence/candidates/:id/documents', ...auth, getDocumentViewer);
employerIntelligenceRouter.get('/employer/intelligence/candidates/:id/credentials', ...auth, getCredentialViewer);
employerIntelligenceRouter.post('/employer/intelligence/candidates/compare', ...auth, compareCandidates);
