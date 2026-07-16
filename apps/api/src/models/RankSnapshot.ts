import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICompetitorPosition {
  domain: string;
  position: number;
}

export interface IRankSnapshot extends Document {
  keywordId: Types.ObjectId;
  projectId: Types.ObjectId;
  position: number; // e.g. 1-100, or 101 if unranked
  aioPresence: boolean;
  competitors: ICompetitorPosition[];
  date: Date;
  createdAt: Date;
}

const RankSnapshotSchema = new Schema<IRankSnapshot>({
  keywordId: { type: Schema.Types.ObjectId, ref: 'TrackedKeyword', required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  position: { type: Number, required: true },
  aioPresence: { type: Boolean, default: false },
  competitors: [
    {
      domain: { type: String, required: true },
      position: { type: Number, required: true },
    },
  ],
  date: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Index to find snaps by keyword and date
RankSnapshotSchema.index({ keywordId: 1, date: 1 }, { unique: true });

export const RankSnapshot = mongoose.model<IRankSnapshot>('RankSnapshot', RankSnapshotSchema);
