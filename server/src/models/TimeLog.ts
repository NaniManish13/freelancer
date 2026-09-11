import mongoose, { Document, Schema } from 'mongoose';

export interface ITimeLog extends Document {
  user: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  task?: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  description: string;
  hourlyRate: number;
  amount: number;
  isBilled: boolean;
  invoice?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TimeLogSchema = new Schema<ITimeLog>(
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
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      index: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: [0, 'Duration cannot be negative'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    hourlyRate: {
      type: Number,
      required: true,
      min: [0, 'Hourly rate cannot be negative'],
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    isBilled: {
      type: Boolean,
      default: false,
      index: true,
    },
    invoice: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

TimeLogSchema.index({ user: 1, isBilled: 1 });
TimeLogSchema.index({ user: 1, project: 1, isBilled: 1 });
TimeLogSchema.index({ user: 1, startTime: -1 });

export const TimeLog: mongoose.Model<ITimeLog> = (mongoose.models.TimeLog as mongoose.Model<ITimeLog>) || mongoose.model<ITimeLog>('TimeLog', TimeLogSchema);
