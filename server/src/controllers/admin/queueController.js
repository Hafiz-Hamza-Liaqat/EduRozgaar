import { asyncHandler } from '../../utils/asyncHandler.js';
import { getQueueStats, processQueue, retryDeadJobs } from '../../services/jobQueueService.js';

export const getQueueStatus = asyncHandler(async (_req, res) => {
  res.json(await getQueueStats());
});

export const processQueueNow = asyncHandler(async (_req, res) => {
  const result = await processQueue(50);
  res.json(result);
});

export const retryFailedJobs = asyncHandler(async (_req, res) => {
  const count = await retryDeadJobs(20);
  res.json({ retried: count });
});
