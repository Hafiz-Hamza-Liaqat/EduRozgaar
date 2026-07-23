import { Router } from 'express';
import {
  getFeaturedJobs,
  getFeaturedScholarships,
  getSponsoredJobs,
  getSponsoredScholarships,
  getAdSlots,
  listAdSlots,
  createAdSlot,
  updateAdSlot,
  deleteAdSlot,
  setJobMonetization,
  setScholarshipMonetization,
  trackAdClick,
  trackAdImpression,
} from '../controllers/monetizationController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireStaff, requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS } from '../config/rbac.js';
import { adTrackingLimiter } from '../middleware/rateLimit.js';

const monetizationAdmin = [requireAuth, requireStaff, requirePermission(PERMISSIONS.MODERATE_ADS)];

export const monetizationRouter = Router();

monetizationRouter.get('/monetization/featured/jobs', getFeaturedJobs);
monetizationRouter.get('/monetization/featured/scholarships', getFeaturedScholarships);
monetizationRouter.get('/monetization/sponsored/jobs', getSponsoredJobs);
monetizationRouter.get('/monetization/sponsored/scholarships', getSponsoredScholarships);
monetizationRouter.get('/monetization/ad-slots', getAdSlots);
monetizationRouter.post('/monetization/impression', adTrackingLimiter, trackAdImpression);
monetizationRouter.post('/monetization/click', adTrackingLimiter, trackAdClick);

monetizationRouter.get('/monetization/admin/ad-slots', ...monetizationAdmin, listAdSlots);
monetizationRouter.post('/monetization/admin/ad-slots', ...monetizationAdmin, createAdSlot);
monetizationRouter.put('/monetization/admin/ad-slots/:id', ...monetizationAdmin, updateAdSlot);
monetizationRouter.delete('/monetization/admin/ad-slots/:id', ...monetizationAdmin, deleteAdSlot);
monetizationRouter.patch('/monetization/admin/jobs/:id', ...monetizationAdmin, setJobMonetization);
monetizationRouter.patch('/monetization/admin/scholarships/:id', ...monetizationAdmin, setScholarshipMonetization);
