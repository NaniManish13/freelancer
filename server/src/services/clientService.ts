import mongoose from 'mongoose';
import { Client, IClient } from '../models/Client.js';
import { Project } from '../models/Project.js';
import { Invoice } from '../models/Invoice.js';
import { User } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

export class ClientService {
  static async getClients(userId: string, search?: string) {
    const query: any = { user: userId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const clients = await Client.find(query).sort({ createdAt: -1 });

    // Aggregate active projects count and total revenue per client
    const clientIds = clients.map((c) => c._id);

    const [projectCounts, revenueAgg] = await Promise.all([
      Project.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), client: { $in: clientIds } } },
        { $group: { _id: '$client', totalProjects: { $sum: 1 }, activeProjects: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } } } },
      ]),
      Invoice.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), client: { $in: clientIds }, status: 'PAID' } },
        { $group: { _id: '$client', totalPaid: { $sum: '$total' } } },
      ]),
    ]);

    const projectMap = new Map(projectCounts.map((p) => [p._id.toString(), p]));
    const revenueMap = new Map(revenueAgg.map((r) => [r._id.toString(), r.totalPaid]));

    return clients.map((c) => {
      const pData = projectMap.get(c._id.toString()) || { totalProjects: 0, activeProjects: 0 };
      const totalPaid = revenueMap.get(c._id.toString()) || 0;
      return {
        ...c.toObject(),
        totalProjects: pData.totalProjects,
        activeProjects: pData.activeProjects,
        totalPaid,
      };
    });
  }

  static async getClientById(id: string, userId: string) {
    const client = await Client.findOne({ _id: id, user: userId });
    if (!client) {
      throw new AppError('Client not found or you do not have permission to view it.', 404);
    }

    const [projects, invoices] = await Promise.all([
      Project.find({ user: userId, client: id }).sort({ createdAt: -1 }),
      Invoice.find({ user: userId, client: id }).sort({ issueDate: -1 }),
    ]);

    return {
      ...client.toObject(),
      projects,
      invoices,
    };
  }

  static async createClient(data: Partial<IClient>, userId: string, userPlan: 'FREE' | 'PRO') {
    // Check Free plan client limit (Max 2 clients for FREE tier)
    if (userPlan === 'FREE') {
      const currentClientCount = await Client.countDocuments({ user: userId });
      if (currentClientCount >= 2) {
        throw new AppError(
          'You have reached the Free plan client limit. Upgrade to Pro to add unlimited clients.',
          403
        );
      }
    }

    const client = await Client.create({
      ...data,
      user: userId,
    });

    return client;
  }

  static async updateClient(id: string, data: Partial<IClient>, userId: string) {
    const { name, companyName, email, phone, address, defaultHourlyRate, currency } = data;
    const client = await Client.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { name, companyName, email, phone, address, defaultHourlyRate, currency } },
      { returnDocument: 'after', runValidators: true }
    );

    if (!client) {
      throw new AppError('Client not found or you do not have permission to modify it.', 404);
    }

    return client;
  }

  static async deleteClient(id: string, userId: string) {
    const client = await Client.findOne({ _id: id, user: userId });
    if (!client) {
      throw new AppError('Client not found or you do not have permission to delete it.', 404);
    }

    // Check if client has associated projects or invoices
    const [projectCount, invoiceCount] = await Promise.all([
      Project.countDocuments({ user: userId, client: id }),
      Invoice.countDocuments({ user: userId, client: id }),
    ]);

    if (projectCount > 0 || invoiceCount > 0) {
      throw new AppError(
        `Cannot delete client with active projects (${projectCount}) or invoices (${invoiceCount}). Please delete or reassign them first.`,
        400
      );
    }

    await Client.deleteOne({ _id: id, user: userId });
    return { success: true, message: 'Client deleted successfully.' };
  }
}
