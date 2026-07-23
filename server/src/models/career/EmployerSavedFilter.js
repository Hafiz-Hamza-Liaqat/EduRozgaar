import mongoose from 'mongoose';

const employerSavedFilterSchema = new mongoose.Schema(
  {
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    filters: {
      type: {
        q: { type: String, default: '' },
        jobId: { type: String, default: null },
        pipelineStage: { type: String, default: null },
        minReadiness: { type: Number, default: null },
        location: { type: String, default: '' },
        skill: { type: String, default: '' },
      },
      default: {},
    },
  },
  { timestamps: true, collection: 'employerSavedFilters' }
);

employerSavedFilterSchema.index({ employerId: 1, name: 1 }, { unique: true });

export const EmployerSavedFilter = mongoose.model('EmployerSavedFilter', employerSavedFilterSchema);
