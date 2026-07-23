import { Router } from 'express';
import { sendNotification } from '../controllers/notificationsController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireStaff, requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS } from '../config/rbac.js';

export const notificationsRouter = Router();

notificationsRouter.post('/notifications/send', requireAuth, requireStaff, requirePermission(PERMISSIONS.NOTIFICATIONS_SEND), sendNotification);
