import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type RecordingType = 'upload' | 'live';

export interface IRecording extends Document {
  meeting: Types.ObjectId;
  filePath: string;
  cloudinaryPublicId: string;
  duration: number; // seconds
  uploadTime: Date;
  recordingType: RecordingType;
  fileSize: number; // bytes
  mimeType: string;
  originalFileName: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecordingSchema = new Schema<IRecording>(
  {
    meeting: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      index: true,
    },
    filePath: {
      type: String,
      required: [true, 'File path / URL is required'],
    },
    cloudinaryPublicId: {
      type: String,
      default: '',
    },
    duration: {
      type: Number,
      default: 0,
    },
    uploadTime: {
      type: Date,
      default: Date.now,
    },
    recordingType: {
      type: String,
      enum: ['upload', 'live'],
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: '',
    },
    originalFileName: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Recording: Model<IRecording> = mongoose.model<IRecording>('Recording', RecordingSchema);

export default Recording;
