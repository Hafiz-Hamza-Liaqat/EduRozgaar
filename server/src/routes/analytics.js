import { Router } from 'express';
import { searchLimiter } from '../middleware/rateLimit.js';
import * as analytics from '../controllers/analyticsController.js';

/**
 * Additive public analytics ingest (C.7.0.5).
 * Existing POST /api/v1/analytics/event remains unchanged.
 */
export const analyticsRouter = Router();

analyticsRouter.post('/analytics/event', searchLimiter, analytics.recordEvent);
