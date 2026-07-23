import mongoose from 'mongoose';

export const certificationReferenceSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    issuer: { type: String, trim: true, default: '' },
    issuedAt: { type: Date },
    expiresAt: { type: Date },
    credentialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Credential' },
    externalUrl: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

export const CertificationReference = certificationReferenceSchema;
