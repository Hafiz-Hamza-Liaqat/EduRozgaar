import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPlan' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    provider: { type: String, enum: ['stripe', 'manual'], default: 'stripe' },
    providerSessionId: { type: String, index: true, sparse: true },
    providerPaymentId: { type: String, index: true, sparse: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

paymentSchema.index({ employerId: 1, jobId: 1, status: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);
