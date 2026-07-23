import { Webinar } from '../models/Webinar.js';
import { WebinarRegistration } from '../models/WebinarRegistration.js';
import { awardBadge } from './badgesController.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listResponse, paginate } from '../utils/apiResponse.js';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export const listWebinars = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  const status = req.query.status || 'scheduled';
  const query = { status: { $in: ['scheduled', 'live', 'recorded'].includes(status) ? status : ['scheduled', 'live', 'recorded'] } };
  const [data, total] = await Promise.all([
    Webinar.find(query).sort({ scheduledAt: 1 }).skip(skip).limit(limit).lean(),
    Webinar.countDocuments(query),
  ]);
  const pagination = paginate(page, limit, total);
  res.json(listResponse(data, pagination, req.query));
});

export const getUpcoming = asyncHandler(async (req, res) => {
  const limit = Math.min(20, parseInt(req.query.limit, 10) || 5);
  const data = await Webinar.find({ status: { $in: ['scheduled', 'live'] }, scheduledAt: { $gte: new Date() } })
    .sort({ scheduledAt: 1 })
    .limit(limit)
    .lean();
  res.json({ data });
});

export const getWebinarById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
  const doc = await Webinar.findById(id).lean();
  if (!doc) return res.status(404).json({ error: 'Webinar not found' });
  res.json(doc);
});

export const registerForWebinar = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
  const webinar = await Webinar.findById(id);
  if (!webinar) return res.status(404).json({ error: 'Webinar not found' });
  if (!['scheduled', 'live'].includes(webinar.status)) return res.status(400).json({ error: 'Registration closed' });
  const existing = await WebinarRegistration.findOne({ userId, webinarId: id });
  if (existing) return res.status(400).json({ error: 'Already registered' });
  await WebinarRegistration.create({ userId, webinarId: id });
  await awardBadge(userId, 'webinar_registered', 'Webinar Registered', 'Registered for a webinar', { webinarId: id });
  res.status(201).json({ message: 'Registered successfully' });
});

export const getMyRegistrations = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const regs = await WebinarRegistration.find({ userId })
    .populate('webinarId', 'title scheduledAt durationMinutes meetingUrl recordingUrl status')
    .sort({ registeredAt: -1 })
    .limit(50)
    .lean();
  res.json({ data: regs });
});

export const getRecorded = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(20, parseInt(req.query.limit, 10) || 10);
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Webinar.find({ status: 'recorded' }).sort({ scheduledAt: -1 }).skip(skip).limit(limit).lean(),
    Webinar.countDocuments({ status: 'recorded' }),
  ]);
  res.json(listResponse(data, paginate(page, limit, total), req.query));
});
