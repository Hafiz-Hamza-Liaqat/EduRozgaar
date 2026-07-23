import mongoose from 'mongoose';
import { STAFF_ROLES } from '../config/rbac.js';

const userRoleAssignmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    roles: {
      type: [{ type: String, enum: STAFF_ROLES }],
      default: [],
    },
  },
  { timestamps: true }
);

export const UserRoleAssignment = mongoose.model('UserRoleAssignment', userRoleAssignmentSchema);
