import mongoose from 'mongoose';
import { ACTOR_TYPES } from '../../../../shared/career/constants.js';
import { TIMELINE_VERBS, TIMELINE_OBJECT_TYPES, TIMELINE_VISIBILITY_LEVELS } from '../../../../shared/career/timelineVerbs.js';

const timelineEventSchema = new mongoose.Schema(
  {
    subjectTalentProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TalentProfile',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorType: { type: String, enum: ACTOR_TYPES, default: 'system' },
    actorId: { type: String, trim: true, default: null },
    verb: { type: String, enum: TIMELINE_VERBS, required: true, index: true },
    objectType: { type: String, enum: TIMELINE_OBJECT_TYPES, required: true },
    objectId: { type: String, trim: true, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    visibility: { type: String, enum: TIMELINE_VISIBILITY_LEVELS, default: 'private' },
    occurredAt: { type: Date, required: true, index: true },
    locale: { type: String, trim: true, default: 'en' },
    careerEventId: { type: String, trim: true, required: true, unique: true },
    careerEventType: { type: String, trim: true, default: '' },
  },
  {
    timestamps: true,
    collection: 'timelineEvents',
  }
);

timelineEventSchema.index({ subjectTalentProfileId: 1, occurredAt: -1, _id: -1 });
timelineEventSchema.index({ userId: 1, occurredAt: -1 });
timelineEventSchema.index({ objectType: 1, objectId: 1, occurredAt: -1 });

export const TimelineEvent = mongoose.models.TimelineEvent
  || mongoose.model('TimelineEvent', timelineEventSchema);
