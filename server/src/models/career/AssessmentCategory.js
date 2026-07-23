import mongoose from 'mongoose';
import {
  ASSESSMENT_CATEGORY_FAMILIES,
} from '../../../../shared/career/assessmentConstants.js';

/**
 * Configurable assessment category — new slugs without schema redesign.
 */
const assessmentCategorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    family: { type: String, enum: ASSESSMENT_CATEGORY_FAMILIES, required: true },
    labelKey: { type: String, required: true, trim: true },
    descriptionKey: { type: String, trim: true, default: '' },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'assessmentCategories' }
);

assessmentCategorySchema.index({ family: 1, sortOrder: 1 });
assessmentCategorySchema.index({ active: 1 });

export const AssessmentCategory = mongoose.model('AssessmentCategory', assessmentCategorySchema);
