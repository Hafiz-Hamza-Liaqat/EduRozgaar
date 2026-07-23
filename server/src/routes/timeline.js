import { Router } from 'express';
import { requireAuth, requireUserAuth } from '../middleware/auth.js';
import {
  listMyTimeline,
  listApplicationTimeline,
  requireTimelineEnabled,
} from '../controllers/career/timelineController.js';

export const timelineRouter = Router();

const timelineAuth = [requireAuth, requireUserAuth, requireTimelineEnabled];

timelineRouter.get('/timeline', ...timelineAuth, listMyTimeline);
timelineRouter.get('/timeline/applications/:applicationId', ...timelineAuth, listApplicationTimeline);
