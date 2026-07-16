import { Schema, model, Document, Types } from 'mongoose';

export interface ITrackedKeyword extends Document {
  projectId: Types.ObjectId;
  keyword: string;
  targetUrl: string;
  competitorDomains: string[];
  createdAt: Date;
}

const TrackedKeywordSchema = new Schema<ITrackedKeyword>({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  keyword: {
    type: String,
    required: true,
    trim: true,
  },
  targetUrl: {
    type: String,
    required: true,
    trim: true,
  },
  competitorDomains: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes: find keywords by project, and quickly filter by specific keyword inside a project
TrackedKeywordSchema.index({ projectId: 1 });
TrackedKeywordSchema.index({ projectId: 1, keyword: 1 });

export const TrackedKeyword = model<ITrackedKeyword>('TrackedKeyword', TrackedKeywordSchema);
export default TrackedKeyword;
