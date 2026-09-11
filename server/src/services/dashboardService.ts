import mongoose from 'mongoose';
import { Project } from '../models/Project.js';
import { Invoice } from '../models/Invoice.js';
import { TimeLog } from '../models/TimeLog.js';
import { Task } from '../models/Task.js';
import { ProjectService } from './projectService.js';

export class DashboardService {
  static async getDashboardData(userId: string) {
    const userObjId = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Active Projects Count
    const activeProjectsCount = await Project.countDocuments({ user: userId, status: 'ACTIVE' });

    // 2. Pending Invoices (SENT, DRAFT, OVERDUE)
    const pendingInvoicesList = await Invoice.find({
      user: userId,
      status: { $in: ['SENT', 'DRAFT', 'OVERDUE'] },
    });
    const pendingInvoicesCount = pendingInvoicesList.length;
    const outstandingAmount = Number(
      pendingInvoicesList.reduce((acc, inv) => acc + (inv.total || 0), 0).toFixed(2)
    );

    // 3. Revenue This Month (Paid invoices issued or paid this month)
    const paidThisMonth = await Invoice.find({
      user: userId,
      status: 'PAID',
      updatedAt: { $gte: startOfMonth, $lte: endOfMonth },
    });
    const monthlyRevenue = Number(
      paidThisMonth.reduce((acc, inv) => acc + (inv.total || 0), 0).toFixed(2)
    );

    // 4. Hours Logged This Month
    const monthLogs = await TimeLog.find({
      user: userId,
      startTime: { $gte: startOfMonth, $lte: endOfMonth },
    });
    const totalMinutesThisMonth = monthLogs.reduce((acc, log) => acc + (log.durationMinutes || 0), 0);
    const hoursThisMonth = Number((totalMinutesThisMonth / 60).toFixed(1));

    // 5. Project Budget Usage
    const allProjectsWithCalc = await ProjectService.getProjects(userId);
    const projectBudgetUsage = allProjectsWithCalc.map((p: any) => ({
      _id: p._id,
      name: p.name,
      clientName: p.client?.name || 'Unknown',
      budget: p.budget,
      spent: p.calculations.amountSpent,
      remaining: p.calculations.remainingBudget,
      progress: p.calculations.budgetUsagePercent,
      isOverBudget: p.calculations.isOverBudget,
      status: p.status,
      deadline: p.deadline,
    }));

    // 6. Recent Invoices
    const recentInvoices = await Invoice.find({ user: userId })
      .populate('client', 'name companyName currency')
      .sort({ issueDate: -1, createdAt: -1 })
      .limit(6);

    // 7. Upcoming Deadlines (Active projects + incomplete tasks with due dates)
    const [upcomingProjects, upcomingTasks] = await Promise.all([
      Project.find({
        user: userId,
        status: 'ACTIVE',
        deadline: { $exists: true, $ne: null },
      })
        .populate('client', 'name')
        .sort({ deadline: 1 })
        .limit(5),
      Task.find({
        user: userId,
        status: { $ne: 'DONE' },
        dueDate: { $exists: true, $ne: null },
      })
        .populate('project', 'name')
        .sort({ dueDate: 1 })
        .limit(5),
    ]);

    const upcomingDeadlines = [
      ...upcomingProjects.map((p) => ({
        id: p._id,
        type: 'PROJECT' as const,
        title: p.name,
        subtitle: (p.client as any)?.name || 'Project',
        date: p.deadline,
        status: p.status,
      })),
      ...upcomingTasks.map((t) => ({
        id: t._id,
        type: 'TASK' as const,
        title: t.title,
        subtitle: (t.project as any)?.name || 'Task',
        date: t.dueDate,
        status: t.status,
      })),
    ]
      .filter((item) => item.date)
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
      .slice(0, 8);

    // 8. Monthly Revenue Chart (Last 6 months)
    const monthlyRevenueChart = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthLabel = mStart.toLocaleDateString('en-US', { month: 'short' });

      const paidInvoices = await Invoice.find({
        user: userId,
        status: 'PAID',
        issueDate: { $gte: mStart, $lte: mEnd },
      });

      const invoicedInvoices = await Invoice.find({
        user: userId,
        issueDate: { $gte: mStart, $lte: mEnd },
      });

      const paidAmount = paidInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
      const invoicedAmount = invoicedInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);

      monthlyRevenueChart.push({
        month: monthLabel,
        revenue: Number(paidAmount.toFixed(2)),
        invoiced: Number(invoicedAmount.toFixed(2)),
      });
    }

    // 9. Outstanding Payments by Client
    const outstandingByClientAgg = await Invoice.aggregate([
      {
        $match: {
          user: userObjId,
          status: { $in: ['SENT', 'DRAFT', 'OVERDUE'] },
        },
      },
      {
        $group: {
          _id: '$client',
          totalOutstanding: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'clients',
          localField: '_id',
          foreignField: '_id',
          as: 'clientInfo',
        },
      },
      { $unwind: '$clientInfo' },
      {
        $project: {
          clientName: '$clientInfo.name',
          amount: '$totalOutstanding',
        },
      },
      { $sort: { amount: -1 } },
      { $limit: 6 },
    ]);

    return {
      activeProjects: activeProjectsCount,
      pendingInvoices: pendingInvoicesCount,
      outstandingAmount,
      monthlyRevenue,
      hoursThisMonth,
      upcomingDeadlines,
      recentInvoices,
      projectBudgetUsage,
      monthlyRevenueChart,
      outstandingPaymentsChart: outstandingByClientAgg.map((item) => ({
        name: item.clientName,
        value: Number(item.amount.toFixed(2)),
      })),
    };
  }
}
