import { AssessmentCategory } from '../../models/career/AssessmentCategory.js';
import { DEFAULT_ASSESSMENT_CATEGORIES } from '../../../../shared/career/assessmentConstants.js';

export const AssessmentCategoryRepository = {
  async listActive() {
    return AssessmentCategory.find({ active: true }).sort({ family: 1, sortOrder: 1 }).lean();
  },

  async findBySlug(slug) {
    return AssessmentCategory.findOne({ slug }).lean();
  },

  async ensureDefaults() {
    for (let i = 0; i < DEFAULT_ASSESSMENT_CATEGORIES.length; i += 1) {
      const cat = DEFAULT_ASSESSMENT_CATEGORIES[i];
      await AssessmentCategory.updateOne(
        { slug: cat.slug },
        {
          $setOnInsert: {
            slug: cat.slug,
            family: cat.family,
            labelKey: cat.labelKey,
            sortOrder: i,
            active: true,
          },
        },
        { upsert: true }
      );
    }
    return this.listActive();
  },
};
