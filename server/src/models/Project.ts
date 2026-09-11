import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  user: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  budget: number;
  hourlyRate: number;
  startDate?: Date;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User owner is required'],
      index: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'PAUSED'],
      default: 'ACTIVE',
      index: true,
    },
    budget: {
      type: Number,
      default: 0,
      min: [0, 'Budget cannot be negative'],
    },
    hourlyRate: {
      type: Number,
      default: 60,
      min: [0, 'Hourly rate cannot be negative'],
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ProjectSchema.index({ user: 1, status: 1 });
ProjectSchema.index({ user: 1, client: 1 });
ProjectSchema.index({ user: 1, deadline: 1 });

export const Project: mongoose.Model<IProject> = (mongoose.models.Project as mongoose.Model<IProject>) || mongoose.model<IProject>('Project', ProjectSchema);
