import mongoose from 'mongoose';
import { LANGUAGE_PROFICIENCY } from '../../../../shared/career/constants.js';

export const languageSkillSchema = new mongoose.Schema(
  {
    language: { type: String, trim: true, required: true },
    proficiency: { type: String, enum: LANGUAGE_PROFICIENCY, default: 'conversational' },
  },
  { _id: false }
);

export const LanguageSkill = languageSkillSchema;
