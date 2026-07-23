import mongoose from 'mongoose';

const userNotificationSchema = new mongoose.Schema(
  {
    recipientType: { type: String, enum: ['user', 'employer', 'staff'], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer' },
    category: {
      type: String,
      enum: [
        'application',
        'scholarship',
        'admission',
        'saved_search',
        'interview',
        'job',
        'payment',
        'verification',
        'contact',
        'support',
        'system',
        'import',
        'newsletter',
        'general',
      ],
      default: 'general',
    },
    type: { type: String, required: true, maxlength: 80 },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, maxlength: 2000 },
    link: { type: String, maxlength: 500 },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

userNotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
userNotificationSchema.index({ employerId: 1, read: 1, createdAt: -1 });
userNotificationSchema.index({ recipientType: 1, createdAt: -1 });

export const UserNotification = mongoose.model('UserNotification', userNotificationSchema);
