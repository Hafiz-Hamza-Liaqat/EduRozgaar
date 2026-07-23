import mongoose from 'mongoose';

const submissionFileSchema = new mongoose.Schema(
  {
    fieldName: String,
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaAsset' },
    url: String,
    filename: String,
    mimeType: String,
    size: Number,
  },
  { _id: false },
);

const formSubmissionSchema = new mongoose.Schema(
  {
    formId: { type: mongoose.Schema.Types.ObjectId, ref: 'FormDefinition', required: true, index: true },
    formSlug: { type: String, required: true, index: true },
    formVersion: { type: Number, default: 1 },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    files: { type: [submissionFileSchema], default: [] },
    status: { type: String, enum: ['new', 'read'], default: 'new' },
    readAt: Date,
    ipHash: String,
    userAgent: String,
    spamScore: { type: Number, default: 0 },
    metadata: {
      source: { type: String, default: 'web' },
      pageUrl: String,
    },
  },
  { timestamps: true },
);

formSubmissionSchema.index({ createdAt: -1 });
formSubmissionSchema.index({ status: 1, createdAt: -1 });
formSubmissionSchema.index({ formId: 1, status: 1 });

export const FormSubmission = mongoose.model('FormSubmission', formSubmissionSchema);
