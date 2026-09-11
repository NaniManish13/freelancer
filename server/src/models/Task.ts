import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  user: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User owner is required'],
      index: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'DONE'],
      default: 'TODO',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    dueDate: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

TaskSchema.index({ user: 1, project: 1, status: 1 });
TaskSchema.index({ user: 1, dueDate: 1 });

export const Task: mongoose.Model<ITask> = (mongoose.models.Task as mongoose.Model<ITask>) || mongoose.model<ITask>('Task', TaskSchema);
