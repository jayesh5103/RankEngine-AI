import { Schema, model, Document } from 'mongoose';

export type UserRole = 'agency_owner' | 'marketer' | 'developer';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  companyName: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['agency_owner', 'marketer', 'developer'],
    required: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create appropriate unique index for email
UserSchema.index({ email: 1 }, { unique: true });

export const User = model<IUser>('User', UserSchema);
export default User;
