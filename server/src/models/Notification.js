import mongoose from 'mongoose';

// Broadcast/targeted alerts (admin-created). For user-specific notifications, use userId + type.
const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    target_province: { type: String },
    target_interest: { type: String },
    delivered: { type: Boolean, default: false },
    link: { type: String },
    audience: { type: String, default: 'all' },
    channel: { type: String, enum: ['in_app', 'email', 'whatsapp', 'push'], default: 'in_app' },
    scheduledAt: { type: Date },
    status: { type: String, enum: ['draft', 'scheduled', 'sent'], default: 'sent' },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ target_province: 1, target_interest: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);
