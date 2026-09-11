import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoiceItem extends Document {
  invoice: mongoose.Types.ObjectId;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  timeLog?: mongoose.Types.ObjectId;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
  {
    invoice: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: [true, 'Invoice reference is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
    },
    rate: {
      type: Number,
      required: true,
      min: [0, 'Rate cannot be negative'],
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    timeLog: {
      type: Schema.Types.ObjectId,
      ref: 'TimeLog',
    },
  },
  {
    timestamps: true,
  }
);

export const InvoiceItem: mongoose.Model<IInvoiceItem> = (mongoose.models.InvoiceItem as mongoose.Model<IInvoiceItem>) || mongoose.model<IInvoiceItem>('InvoiceItem', InvoiceItemSchema);
