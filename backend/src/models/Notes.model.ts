import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import crypto from 'crypto';

export interface INotes extends Document {
  summary: Types.ObjectId;
  meeting: Types.ObjectId;
  noteContent: string; // markdown content
  shareToken?: string;
  isPublicShare: boolean;
  editedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotesSchema = new Schema<INotes>(
  {
    summary: {
      type: Schema.Types.ObjectId,
      ref: 'Summary',
      required: true,
      index: true,
    },
    meeting: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      index: true,
    },
    noteContent: {
      type: String,
      default: '',
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    isPublicShare: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

NotesSchema.index({ noteContent: 'text' });

// Generate a unique share token for the note
NotesSchema.methods.generateShareToken = function (): string {
  const token = crypto.randomBytes(16).toString('hex');
  this.shareToken = token;
  this.isPublicShare = true;
  return token;
};

const Notes: Model<INotes> = mongoose.model<INotes>('Notes', NotesSchema);

export default Notes;
