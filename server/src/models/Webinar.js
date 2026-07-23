import mongoose from 'mongoose';

const webinarSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String },
    description: { type: String },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60 },
    meetingUrl: { type: String },
    recordingUrl: { type: String },
    status: { type: String, enum: ['draft', 'scheduled', 'live', 'recorded', 'cancelled'], default: 'scheduled' },
    isSponsored: { type: Boolean, default: false },
    speakerName: { type: String },
    speakerTitle: { type: String },
    speakerBio: { type: String },
    speakerImageUrl: { type: String },
    registrationUrl: { type: String },
    bannerUrl: { type: String },
    seoTitle: { type: String },
    metaDescription: { type: String },
    publishedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

webinarSchema.index({ scheduledAt: 1 });
webinarSchema.index({ status: 1 });

export const Webinar = mongoose.model('Webinar', webinarSchema);
