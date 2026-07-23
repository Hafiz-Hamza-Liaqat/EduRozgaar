import mongoose from 'mongoose';
import { APPLICATION_NOTE_VISIBILITY, ACTOR_TYPES } from '../../../../shared/career/constants.js';

export const applicationNoteSchema = new mongoose.Schema(
  {
    body: { type: String, trim: true, required: true },
    visibility: { type: String, enum: APPLICATION_NOTE_VISIBILITY, default: 'private' },
    createdAt: { type: Date, default: Date.now },
    createdByActorType: { type: String, enum: ACTOR_TYPES, default: 'talent' },
    createdByActorId: { type: mongoose.Schema.Types.ObjectId, default: null },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);
