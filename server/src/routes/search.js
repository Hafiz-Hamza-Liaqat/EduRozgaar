import { Router } from 'express';
import { searchLimiter } from '../middleware/rateLimit.js';
import * as search from '../controllers/searchController.js';

export const searchRouter = Router();

searchRouter.get('/search', searchLimiter, search.getSearch);
searchRouter.get('/search/suggestions', searchLimiter, search.getSuggestions);
searchRouter.post('/search/click', searchLimiter, search.postSearchClick);
searchRouter.get('/search/related/:entityType/:entityId', searchLimiter, search.getRelated);
