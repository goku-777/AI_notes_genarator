import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface ISummary extends Document {
  transcript: Types.ObjectId;
  summaryText: string;
  meetingOverview: string;
  keyDiscussionPoints: string[];
  importantDecisions: string[];
  nextSteps: string[];
  risks: string[];
  highlights: string[];
  smartTitle: string;
  keywords: string[];
  tags: string[];
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SummarySchema = new Schema<ISummary>(
  {
    transcript: {
      type: Schema.Types.ObjectId,
      ref: 'Transcript',
      required: true,
      index: true,
      unique: true,
    },
    summaryText: {
      type: String,
      default: '',
    },
    meetingOverview: {
      type: String,
      default: '',
    },
    keyDiscussionPoints: [{ type: String }],
    importantDecisions: [{ type: String }],
    nextSteps: [{ type: String }],
    risks: [{ type: String }],
    highlights: [{ type: String }],
    smartTitle: {
      type: String,
      default: '',
    },
    keywords: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Summary: Model<ISummary> = mongoose.model<ISummary>('Summary', SummarySchema);

export default Summary;
