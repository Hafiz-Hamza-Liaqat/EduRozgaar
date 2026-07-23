import mongoose from 'mongoose';
import { OPPORTUNITY_TYPES } from '../../../../shared/career/constants.js';

export const opportunityReferenceSchema = new mongoose.Schema(
  {
    opportunityType: { type: String, enum: OPPORTUNITY_TYPES, required: true },
    opportunityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    locale: { type: String, trim: true, default: 'en' },
    market: { type: String, trim: true, default: '' },
  },
  { _id: false }
);
