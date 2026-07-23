import { Router } from 'express';
import { searchLimiter } from '../middleware/rateLimit.js';
import * as dynamicContent from '../controllers/dynamicContentController.js';

export const dynamicContentRouter = Router();

dynamicContentRouter.get('/dynamic-content/:source', searchLimiter, dynamicContent.getDynamicContent);
dynamicContentRouter.post('/dynamic-content/batch', searchLimiter, dynamicContent.postDynamicContentBatch);
dynamicContentRouter.post('/dynamic-content/invalidate-cache', dynamicContent.invalidateCache);
