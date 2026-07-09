import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type ActionItemStatus = 'pending' | 'in-progress' | 'completed';

export interface IActionItem extends Document {
  summary: Types.ObjectId;
  task: string;
  status: ActionItemStatus;
  deadline?: Date;
  assignee?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

const ActionItemSchema = new Schema<IActionItem>(
  {
    summary: {
      type: Schema.Types.ObjectId,
      ref: 'Summary',
      required: true,
      index: true,
    },
    task: {
      type: String,
      required: [true, 'Task description is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    deadline: {
      type: Date,
    },
    assignee: {
      type: String,
      default: '',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  { timestamps: true }
);

const ActionItem: Model<IActionItem> = mongoose.model<IActionItem>('ActionItem', ActionItemSchema);

export default ActionItem;
