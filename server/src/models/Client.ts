import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  address?: string;
  defaultHourlyRate: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User owner is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Client email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    defaultHourlyRate: {
      type: Number,
      default: 50,
      min: [0, 'Hourly rate cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

ClientSchema.index({ user: 1, name: 1 });

export const Client: mongoose.Model<IClient> = (mongoose.models.Client as mongoose.Model<IClient>) || mongoose.model<IClient>('Client', ClientSchema);
