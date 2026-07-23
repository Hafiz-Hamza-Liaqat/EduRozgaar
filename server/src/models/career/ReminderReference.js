import mongoose from 'mongoose';
import { REMINDER_STATUSES } from '../../../../shared/career/constants.js';

export const reminderReferenceSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    remindAt: { type: Date, required: true },
    channel: { type: String, trim: true, default: 'in_app' },
    status: { type: String, enum: REMINDER_STATUSES, default: 'scheduled' },
    createdAt: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: true }
);
