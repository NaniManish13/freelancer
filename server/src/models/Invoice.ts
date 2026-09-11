import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoice extends Document {
  user: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  pdfPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
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
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      trim: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'],
      default: 'DRAFT',
      index: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    pdfPath: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

InvoiceSchema.index({ user: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ user: 1, status: 1 });
InvoiceSchema.index({ user: 1, issueDate: -1 });

export const Invoice: mongoose.Model<IInvoice> = (mongoose.models.Invoice as mongoose.Model<IInvoice>) || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
