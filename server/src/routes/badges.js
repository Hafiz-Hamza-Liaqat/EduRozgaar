import { Router } from 'express';
import { getMyBadges, getLeaderboard, getMyRank } from '../controllers/badgesController.js';
import { requireAuth, requireUserAuth } from '../middleware/auth.js';

export const badgesRouter = Router();

badgesRouter.get('/badges/me', requireAuth, requireUserAuth, getMyBadges);
badgesRouter.get('/badges/leaderboard', getLeaderboard);
badgesRouter.get('/badges/rank', requireAuth, requireUserAuth, getMyRank);
