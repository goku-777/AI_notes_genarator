import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type MeetingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'deleted';

export interface IMeeting extends Document {
  user: Types.ObjectId;
  title: string;
  date: Date;
  status: MeetingStatus;
  keywords: string[];
  tags: string[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'deleted'],
      default: 'pending',
      index: true,
    },
    keywords: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

MeetingSchema.index({ title: 'text' });
MeetingSchema.index({ user: 1, createdAt: -1 });

const Meeting: Model<IMeeting> = mongoose.model<IMeeting>('Meeting', MeetingSchema);

export default Meeting;
