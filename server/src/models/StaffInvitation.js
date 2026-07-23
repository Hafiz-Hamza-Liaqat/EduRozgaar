import mongoose from 'mongoose';

const staffInvitationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    role: { type: String, enum: ['Editor', 'Moderator', 'Admin'], required: true },
    tokenHash: { type: String, required: true, select: false },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'revoked'],
      default: 'pending',
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    invitedByEmail: { type: String, trim: true },
    acceptedAt: { type: Date },
    message: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

staffInvitationSchema.index({ email: 1, status: 1 });

export const StaffInvitation = mongoose.model('StaffInvitation', staffInvitationSchema);
