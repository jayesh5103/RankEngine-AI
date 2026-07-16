import mongoose, { Schema, Document } from 'mongoose';

export interface ICompetitor {
  url: string;
  wordCount: number;
  title: string;
}

export interface ISerpAnalysis extends Document {
  keyword: string;
  date: string; // YYYY-MM-DD format
  avgWordCount: number;
  sharedEntities: string[];
  sharedSubtopics: string[];
  competitors: ICompetitor[];
  createdAt: Date;
}

const SerpAnalysisSchema = new Schema<ISerpAnalysis>({
  keyword: { type: String, required: true, lowercase: true, trim: true },
  date: { type: String, required: true },
  avgWordCount: { type: Number, required: true },
  sharedEntities: [{ type: String }],
  sharedSubtopics: [{ type: String }],
  competitors: [
    {
      url: { type: String, required: true },
      wordCount: { type: Number, required: true },
      title: { type: String, default: 'Untitled' },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

// Unique compound index on keyword + date
SerpAnalysisSchema.index({ keyword: 1, date: 1 }, { unique: true });

export const SerpAnalysis = mongoose.model<ISerpAnalysis>('SerpAnalysis', SerpAnalysisSchema);
