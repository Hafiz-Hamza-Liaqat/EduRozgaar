import mongoose from 'mongoose';
import { PIPELINE_STAGES, ACTOR_TYPES } from '../../../../shared/career/constants.js';

export const stageHistorySchema = new mongoose.Schema(
  {
    fromStage: { type: String, enum: PIPELINE_STAGES, required: true },
    toStage: { type: String, enum: PIPELINE_STAGES, required: true },
    at: { type: Date, default: Date.now },
    byActorType: { type: String, enum: ACTOR_TYPES, default: 'talent' },
    byActorId: { type: mongoose.Schema.Types.ObjectId, default: null },
    reason: { type: String, trim: true, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: true }
);
