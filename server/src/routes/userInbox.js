import { Router } from 'express';
import {
  listUserNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  removeNotification,
  getNotificationsForUser,
} from '../controllers/userNotificationsController.js';
import { requireAuth, requireUserAuth } from '../middleware/auth.js';

export const userInboxRouter = Router();

userInboxRouter.get('/inbox/notifications', requireAuth, listUserNotifications);
userInboxRouter.get('/inbox/notifications/unread-count', requireAuth, getUnreadCount);
userInboxRouter.patch('/inbox/notifications/:id/read', requireAuth, markRead);
userInboxRouter.post('/inbox/notifications/mark-all-read', requireAuth, markAllRead);
userInboxRouter.delete('/inbox/notifications/:id', requireAuth, removeNotification);

/** v1 legacy */
userInboxRouter.get('/users/me/notifications', requireAuth, requireUserAuth, getNotificationsForUser);
