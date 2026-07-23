import mongoose from 'mongoose';

export const personalInfoSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date },
    gender: { type: String, trim: true, default: '' },
    nationality: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
    region: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    timeZone: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

export const PersonalInfo = personalInfoSchema;
