import { asyncHandler } from '../../utils/asyncHandler.js';
import { isTimelineEnabled } from '../../config/careerFeatureFlags.js';
import { TimelineService } from '../../services/career/TimelineService.js';

function requireTimelineEnabled(_req, res, next) {
  if (!isTimelineEnabled()) {
    return res.status(503).json({ error: 'Timeline API is disabled' });
  }
  next();
}

export const listMyTimeline = asyncHandler(async (req, res) => {
  const result = await TimelineService.listForUser(req.user.userId, req.query);
  res.json(result);
});

export const listApplicationTimeline = asyncHandler(async (req, res) => {
  const result = await TimelineService.listForApplication(
    req.user.userId,
    req.params.applicationId,
    req.query
  );
  res.json(result);
});

export { requireTimelineEnabled };
