import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function toSafeUser(user) {
  if (!user) return null;
  const u = user.toObject ? user.toObject() : user;
  delete u.password;
  delete u.refreshToken;
  delete u.refreshTokenExpires;
  return u;
}

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: toSafeUser(user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { province, interests, notifications } = req.body;
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (province !== undefined) user.province = String(province).trim();
  if (Array.isArray(interests)) user.interests = interests.filter((i) => typeof i === 'string').slice(0, 50);
  if (notifications && typeof notifications === 'object') {
    if (typeof notifications.email === 'boolean') user.notifications.email = notifications.email;
    if (typeof notifications.push === 'boolean') user.notifications.push = notifications.push;
    if (typeof notifications.whatsapp === 'boolean') user.notifications.whatsapp = notifications.whatsapp;
    if (typeof notifications.telegram === 'boolean') user.notifications.telegram = notifications.telegram;
  }
  if (req.body.name !== undefined) user.name = String(req.body.name).trim();
  if (req.body.preferredLanguage !== undefined && ['en', 'ur', 'ar'].includes(req.body.preferredLanguage)) user.preferredLanguage = req.body.preferredLanguage;
  await user.save();
  res.json({ user: toSafeUser(user) });
});
