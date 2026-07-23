import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'resolved', 'closed'],
      default: 'new',
    },
    ipHash: { type: String },
    userAgent: { type: String, maxlength: 500 },
    adminNotes: { type: String, maxlength: 2000 },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

contactMessageSchema.index({ status: 1, createdAt: -1 });
contactMessageSchema.index({ email: 1 });
contactMessageSchema.index({ subject: 'text', message: 'text', name: 'text' });

export const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
