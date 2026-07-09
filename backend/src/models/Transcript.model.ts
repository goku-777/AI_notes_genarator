import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface ITranscript extends Document {
  recording: Types.ObjectId;
  transcriptText: string;
  language: string;
  editedAt?: Date;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TranscriptSchema = new Schema<ITranscript>(
  {
    recording: {
      type: Schema.Types.ObjectId,
      ref: 'Recording',
      required: true,
      index: true,
      unique: true,
    },
    transcriptText: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'en',
    },
    editedAt: {
      type: Date,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

TranscriptSchema.index({ transcriptText: 'text' });

const Transcript: Model<ITranscript> = mongoose.model<ITranscript>('Transcript', TranscriptSchema);

export default Transcript;
