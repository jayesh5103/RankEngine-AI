import { Schema, model, Document, Types } from 'mongoose';

export interface IProject extends Document {
  name: string;
  ownerId: Types.ObjectId;
  domain: string;
  stagingDomain?: string;
  createdAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  domain: {
    type: String,
    required: true,
    trim: true,
  },
  stagingDomain: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index to quickly fetch all projects owned by a specific user
ProjectSchema.index({ ownerId: 1 });

export const Project = model<IProject>('Project', ProjectSchema);
export default Project;
