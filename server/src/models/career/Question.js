import mongoose from 'mongoose';
import { QUESTION_TYPES } from '../../../../shared/career/assessmentConstants.js';

/**
 * Canonical Question — owned by a QuestionBank (C.8.4).
 * Correct answers never exposed on public attempt payloads.
 */
const questionSchema = new mongoose.Schema(
  {
    questionBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionBank', required: true, index: true },
    prompt: { type: String, required: true, trim: true },
    questionType: { type: String, enum: QUESTION_TYPES, default: 'mcq' },
    options: { type: [String], default: [] },
    correctIndex: { type: Number, required: true },
    correctIndexes: { type: [Number], default: [] },
    explanation: { type: String, trim: true, default: '' },
    difficulty: { type: Number, min: 1, max: 5, default: 3 },
    tags: { type: [String], default: [] },
    legacyMcqId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mcq', default: null },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    locale: { type: String, trim: true, default: 'en' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'assessmentQuestions' }
);

questionSchema.index({ questionBankId: 1, status: 1 });

export const Question = mongoose.model('Question', questionSchema);
