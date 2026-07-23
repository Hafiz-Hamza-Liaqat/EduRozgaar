import { Router } from 'express';
import { subscribe, unsubscribe, sendDaily } from '../controllers/newsletterController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireStaff, requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS } from '../config/rbac.js';

export const newsletterRouter = Router();

newsletterRouter.post('/newsletter/subscribe', subscribe);
newsletterRouter.post('/newsletter/unsubscribe', unsubscribe);
newsletterRouter.post('/newsletter/send-daily', requireAuth, requireStaff, requirePermission(PERMISSIONS.NOTIFICATIONS_SEND), sendDaily);
