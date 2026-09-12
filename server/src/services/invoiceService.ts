import mongoose from 'mongoose';
import { Invoice, IInvoice } from '../models/Invoice.js';
import { InvoiceItem } from '../models/InvoiceItem.js';
import { Client } from '../models/Client.js';
import { TimeLog } from '../models/TimeLog.js';
import { Project } from '../models/Project.js';
import { AppError } from '../middleware/errorHandler.js';

export class InvoiceService {
  static async generateInvoiceNumber(userId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `FF-${year}-`;

    const lastInvoice = await Invoice.findOne({
      user: userId,
      invoiceNumber: { $regex: `^${prefix}` },
    }).sort({ invoiceNumber: -1 });

    let nextSeq = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const parts = lastInvoice.invoiceNumber.split('-');
      if (parts.length === 3) {
        const parsed = parseInt(parts[2], 10);
        if (!isNaN(parsed)) {
          nextSeq = parsed + 1;
        }
      }
    }

    return `${prefix}${String(nextSeq).padStart(6, '0')}`;
  }

  static async getInvoices(
    userId: string,
    filters: { client?: string; status?: string; search?: string } = {}
  ) {
    const query: any = { user: userId };
    if (filters.client) query.client = filters.client;
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { invoiceNumber: { $regex: filters.search, $options: 'i' } },
        { notes: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const invoices = await Invoice.find(query)
      .populate('client', 'name companyName email currency')
      .sort({ issueDate: -1, createdAt: -1 });

    return invoices;
  }

  static async getInvoiceById(id: string, userId: string) {
    const invoice = await Invoice.findOne({ _id: id, user: userId })
      .populate('client', 'name companyName email phone address currency')
      .populate('user', 'name email');

    if (!invoice) {
      throw new AppError('Invoice not found or access denied.', 404);
    }

    const items = await InvoiceItem.find({ invoice: id }).populate({
      path: 'timeLog',
      populate: { path: 'project', select: 'name' },
    });

    return {
      ...invoice.toObject(),
      items,
    };
  }

  static async createInvoice(
    data: {
      clientId: string;
      issueDate?: string | Date;
      dueDate: string | Date;
      taxPercent?: number;
      notes?: string;
      timeLogIds?: string[];
      customItems?: Array<{ description: string; quantity: number; rate: number }>;
    },
    userId: string
  ) {
    // 1. Verify Client
    const client = await Client.findOne({ _id: data.clientId, user: userId });
    if (!client) {
      throw new AppError('Client not found or does not belong to you.', 400);
    }

    // 2. Prepare items & calculate subtotal
    const itemsToCreate: Array<{
      description: string;
      quantity: number;
      rate: number;
      amount: number;
      timeLog?: mongoose.Types.ObjectId;
    }> = [];

    const timeLogIds = data.timeLogIds || [];

    if (timeLogIds.length > 0) {
      // Fetch time logs and enforce double-billing protection
      const timeLogs = await TimeLog.find({
        _id: { $in: timeLogIds },
        user: userId,
      }).populate('project', 'name client');

      if (timeLogs.length !== timeLogIds.length) {
        throw new AppError('One or more time logs were not found or do not belong to you.', 400);
      }

      // Check if any is already billed
      const alreadyBilled = timeLogs.filter((log) => log.isBilled);
      if (alreadyBilled.length > 0) {
        throw new AppError(
          `Double-Billing Protection: ${alreadyBilled.length} time log(s) have already been billed on another invoice.`,
          400
        );
      }

      // Verify each time log belongs to a project associated with this client
      for (const log of timeLogs) {
        const project = log.project as any;
        if (!project || project.client.toString() !== data.clientId) {
          throw new AppError(
            'All selected time logs must belong to projects associated with the selected client.',
            400
          );
        }

        const hours = Number((log.durationMinutes / 60).toFixed(2));
        itemsToCreate.push({
          description: `${project.name}: ${log.description || 'Time entry'} (${log.durationMinutes} min)`,
          quantity: hours,
          rate: log.hourlyRate,
          amount: log.amount,
          timeLog: log._id,
        });
      }
    }

    // Add any custom items if provided
    if (data.customItems && data.customItems.length > 0) {
      for (const customItem of data.customItems) {
        if (!customItem.description || customItem.description.trim().length === 0) {
          throw new AppError('Custom item description is required.', 400);
        }
        if (customItem.description.length > 300) {
          throw new AppError('Custom item description must not exceed 300 characters.', 400);
        }
        const qty = Number(customItem.quantity) || 1;
        if (isNaN(qty) || qty <= 0 || qty > 100000) {
          throw new AppError('Custom item quantity must be a positive number up to 100,000.', 400);
        }
        const rate = Number(customItem.rate) || 0;
        if (isNaN(rate) || rate < 0 || rate > 1000000) {
          throw new AppError('Custom item rate must be a non-negative number up to 1,000,000.', 400);
        }
        const amount = Number((qty * rate).toFixed(2));
        itemsToCreate.push({
          description: customItem.description.trim(),
          quantity: qty,
          rate,
          amount,
        });
      }
    }

    if (itemsToCreate.length === 0) {
      throw new AppError('Invoice must contain at least one time log or line item.', 400);
    }

    const subtotal = Number(itemsToCreate.reduce((acc, item) => acc + item.amount, 0).toFixed(2));
    const taxPercent = Number(data.taxPercent) || 0;
    const tax = Number(((subtotal * taxPercent) / 100).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    const invoiceNumber = await this.generateInvoiceNumber(userId);

    const issueDate = data.issueDate ? new Date(data.issueDate) : new Date();
    const dueDate = new Date(data.dueDate);

    // Create invoice record
    const invoice = await Invoice.create({
      user: userId,
      client: data.clientId,
      invoiceNumber,
      issueDate,
      dueDate,
      status: 'SENT',
      subtotal,
      tax,
      total,
      notes: data.notes || '',
    });

    // Create InvoiceItems
    const populatedInvoiceItems = itemsToCreate.map((item) => ({
      ...item,
      invoice: invoice._id,
    }));
    await InvoiceItem.insertMany(populatedInvoiceItems);

    // Mark time logs as billed (Double-Billing Prevention)
    if (timeLogIds.length > 0) {
      await TimeLog.updateMany(
        { _id: { $in: timeLogIds }, user: userId },
        { $set: { isBilled: true, invoice: invoice._id } }
      );
    }

    return invoice.populate('client', 'name companyName email currency');
  }

  static async updateInvoice(
    id: string,
    data: {
      status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
      dueDate?: string | Date;
      notes?: string;
    },
    userId: string
  ) {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: data },
      { returnDocument: 'after', runValidators: true }
    ).populate('client', 'name companyName email currency');

    if (!invoice) {
      throw new AppError('Invoice not found or access denied.', 404);
    }

    return invoice;
  }

  static async deleteInvoice(id: string, userId: string) {
    const invoice = await Invoice.findOne({ _id: id, user: userId });
    if (!invoice) {
      throw new AppError('Invoice not found or access denied.', 404);
    }

    // Reset isBilled and invoice pointer on time logs
    await TimeLog.updateMany(
      { invoice: id, user: userId },
      { $set: { isBilled: false, invoice: null } }
    );

    // Delete invoice items and invoice
    await InvoiceItem.deleteMany({ invoice: id });
    await Invoice.deleteOne({ _id: id, user: userId });

    return { success: true, message: 'Invoice deleted and associated time logs unbilled.' };
  }
}
