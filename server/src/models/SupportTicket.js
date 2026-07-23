import mongoose from 'mongoose';

const ticketMessageSchema = new mongoose.Schema(
  {
    authorType: { type: String, enum: ['user', 'employer', 'staff'], required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId },
    authorName: { type: String },
    body: { type: String, required: true, maxlength: 5000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, unique: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    category: {
      type: String,
      enum: ['account', 'jobs', 'payments', 'technical', 'content', 'other'],
      default: 'other',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['open', 'in_progress', 'waiting', 'resolved', 'closed'], default: 'open' },
    submitterType: { type: String, enum: ['user', 'employer', 'guest'], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer' },
    guestName: { type: String },
    guestEmail: { type: String },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    messages: [ticketMessageSchema],
    closedAt: { type: Date },
  },
  { timestamps: true }
);

supportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });
supportTicketSchema.index({ subject: 'text' });

supportTicketSchema.pre('save', async function (next) {
  if (!this.ticketNumber) {
    const count = await this.constructor.countDocuments();
    this.ticketNumber = `TKT-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
