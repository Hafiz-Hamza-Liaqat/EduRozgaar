import mongoose from 'mongoose';
import { APPLICATION_CONTACT_ROLES } from '../../../../shared/career/constants.js';

export const applicationContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    role: { type: String, enum: APPLICATION_CONTACT_ROLES, default: 'recruiter' },
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    organization: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

export const interviewScheduleSchema = new mongoose.Schema(
  {
    scheduledAt: { type: Date, default: null },
    mode: { type: String, trim: true, default: 'video' },
    location: { type: String, trim: true, default: '' },
    meetingUrl: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    outcome: { type: String, trim: true, default: '' },
  },
  { _id: false }
);
