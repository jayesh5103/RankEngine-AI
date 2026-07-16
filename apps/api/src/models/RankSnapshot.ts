import { Schema, model, Document, Types } from 'mongoose';

export interface IRankSnapshot extends Document {
  trackedKeywordId: Types.ObjectId;
  position?: number | null;
  date: Date;
  aioPresence: boolean;
}

const RankSnapshotSchema = new Schema<IRankSnapshot>({
  trackedKeywordId: {
    type: Schema.Types.ObjectId,
    ref: 'TrackedKeyword',
    required: true,
  },
  position: {
    type: Number,
    default: null, // Nullable if the page is not ranking in the top search results
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  aioPresence: {
    type: Boolean,
    required: true,
    default: false, // Whether the page appeared in an AI Overview (SGE) search block
  },
});

// Indexes: search snapshots by tracked keyword, and sort snapshots chronologically
RankSnapshotSchema.index({ trackedKeywordId: 1 });
RankSnapshotSchema.index({ trackedKeywordId: 1, date: -1 });

export const RankSnapshot = model<IRankSnapshot>('RankSnapshot', RankSnapshotSchema);
export default RankSnapshot;
