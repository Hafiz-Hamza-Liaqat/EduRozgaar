import { Notification } from '../models/Notification.js';
import { UserNotification } from '../models/UserNotification.js';
import { User } from '../models/User.js';
import { STAFF_ROLES } from '../config/rbac.js';

export async function createNotification(data) {
  return Notification.create(data);
}

/**
 * Create a per-user/employer/staff inbox notification.
 */
export async function createUserNotification({
  recipientType,
  userId,
  employerId,
  category = 'general',
  type,
  title,
  body,
  link,
  metadata,
}) {
  return UserNotification.create({
    recipientType,
    userId,
    employerId,
    category,
    type,
    title,
    body,
    link,
    metadata,
  });
}

export async function notifyUser(userId, payload) {
  return createUserNotification({ recipientType: 'user', userId, ...payload });
}

export async function notifyEmployer(employerId, payload) {
  return createUserNotification({ recipientType: 'employer', employerId, ...payload });
}

/** Notify all staff users (admins, moderators, editors). */
export async function notifyStaff(payload) {
  const staff = await User.find({ role: { $in: STAFF_ROLES } }).select('_id').lean();
  if (!staff.length) return [];
  const docs = staff.map((u) => ({
    recipientType: 'staff',
    userId: u._id,
    category: payload.category || 'system',
    type: payload.type,
    title: payload.title,
    body: payload.body,
    link: payload.link,
    metadata: payload.metadata,
  }));
  return UserNotification.insertMany(docs);
}

export async function getUnreadCount({ recipientType, userId, employerId }) {
  const filter = { recipientType, read: false };
  if (recipientType === 'user' || recipientType === 'staff') filter.userId = userId;
  if (recipientType === 'employer') filter.employerId = employerId;
  return UserNotification.countDocuments(filter);
}
