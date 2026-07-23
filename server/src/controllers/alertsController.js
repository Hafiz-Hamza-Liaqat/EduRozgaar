import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sanitizeString } from '../utils/sanitize.js';

/**
 * Placeholder: Telegram API integration. Target by province & interest.
 */
export const sendTelegramAlert = asyncHandler(async (req, res) => {
  const { province, interest, message: _message, title: _title } = req.body || {};
  const q = {};
  if (province) q.province = new RegExp(sanitizeString(province), 'i');
  if (interest) q.interests = Array.isArray(interest) ? { $in: interest } : sanitizeString(interest);
  const count = await User.countDocuments(q);
  // Placeholder: call Telegram Bot API to send message to subscribed users
  res.json({
    sent: 0,
    targetCount: count,
    message: 'Telegram API placeholder. Integrate Telegram Bot API for delivery.',
  });
});

/**
 * Placeholder: WhatsApp Business API. Target by province & interest.
 */
export const sendWhatsAppAlert = asyncHandler(async (req, res) => {
  const { province, interest, message: _message, title: _title } = req.body || {};
  const q = {};
  if (province) q.province = new RegExp(sanitizeString(province), 'i');
  if (interest) q.interests = Array.isArray(interest) ? { $in: interest } : sanitizeString(interest);
  const count = await User.countDocuments(q);
  res.json({
    sent: 0,
    targetCount: count,
    message: 'WhatsApp Business API placeholder. Integrate for delivery.',
  });
});
