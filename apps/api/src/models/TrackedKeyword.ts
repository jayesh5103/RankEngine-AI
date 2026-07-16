import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITrackedKeyword extends Document {
  projectId: Types.ObjectId;
  keyword: string;
  targetUrl: string;
  competitorDomains: string[];
  createdAt: Date;
}

const TrackedKeywordSchema = new Schema<ITrackedKeyword>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  keyword: { type: String, required: true, trim: true },
  targetUrl: { type: String, required: true, trim: true },
  competitorDomains: [{ type: String, trim: true }],
  createdAt: { type: Date, default: Date.now },
});

export const TrackedKeyword = mongoose.model<ITrackedKeyword>('TrackedKeyword', TrackedKeywordSchema);
