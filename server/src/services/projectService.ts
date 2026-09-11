import mongoose from 'mongoose';
import { Project, IProject } from '../models/Project.js';
import { Client } from '../models/Client.js';
import { Task } from '../models/Task.js';
import { TimeLog } from '../models/TimeLog.js';
import { AppError } from '../middleware/errorHandler.js';

export interface ProjectCalculations {
  totalMinutes: number;
  totalHours: number;
  amountSpent: number;
  remainingBudget: number;
  budgetUsagePercent: number;
  isOverBudget: boolean;
  totalTasks: number;
  completedTasks: number;
}

export class ProjectService {
  static async getProjects(
    userId: string,
    filters: { status?: string; client?: string; search?: string } = {}
  ) {
    const query: any = { user: userId };
    if (filters.status) query.status = filters.status;
    if (filters.client) query.client = filters.client;
    if (filters.search) query.name = { $regex: filters.search, $options: 'i' };

    const projects = await Project.find(query)
      .populate('client', 'name companyName currency')
      .sort({ createdAt: -1 });

    const projectIds = projects.map((p) => p._id);

    // Aggregate time logs for all projects in one query
    const [timeLogsAgg, taskAgg] = await Promise.all([
      TimeLog.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), project: { $in: projectIds } } },
        {
          $group: {
            _id: '$project',
            totalMinutes: { $sum: '$durationMinutes' },
            totalLoggedAmount: { $sum: '$amount' },
          },
        },
      ]),
      Task.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), project: { $in: projectIds } } },
        {
          $group: {
            _id: '$project',
            totalTasks: { $sum: 1 },
            completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const timeMap = new Map(timeLogsAgg.map((t) => [t._id.toString(), t]));
    const taskMap = new Map(taskAgg.map((t) => [t._id.toString(), t]));

    return projects.map((project) => {
      const pId = project._id.toString();
      const timeData = timeMap.get(pId) || { totalMinutes: 0, totalLoggedAmount: 0 };
      const taskData = taskMap.get(pId) || { totalTasks: 0, completedTasks: 0 };

      const totalMinutes = timeData.totalMinutes;
      const totalHours = Number((totalMinutes / 60).toFixed(2));
      // amountSpent based on actual logged amount or totalHours * project.hourlyRate
      const amountSpent = Number((timeData.totalLoggedAmount || totalHours * project.hourlyRate).toFixed(2));
      const budget = project.budget || 0;
      const remainingBudget = Number((budget - amountSpent).toFixed(2));
      const budgetUsagePercent = budget > 0 ? Number(((amountSpent / budget) * 100).toFixed(1)) : 0;
      const isOverBudget = budget > 0 && amountSpent > budget;

      return {
        ...project.toObject(),
        calculations: {
          totalMinutes,
          totalHours,
          amountSpent,
          remainingBudget,
          budgetUsagePercent,
          isOverBudget,
          totalTasks: taskData.totalTasks,
          completedTasks: taskData.completedTasks,
        },
      };
    });
  }

  static async getProjectById(id: string, userId: string) {
    const project = await Project.findOne({ _id: id, user: userId }).populate(
      'client',
      'name companyName email currency defaultHourlyRate'
    );

    if (!project) {
      throw new AppError('Project not found or you do not have permission to view it.', 404);
    }

    const [tasks, timeLogs] = await Promise.all([
      Task.find({ user: userId, project: id }).sort({ createdAt: -1 }),
      TimeLog.find({ user: userId, project: id }).sort({ startTime: -1 }),
    ]);

    const totalMinutes = timeLogs.reduce((acc, log) => acc + (log.durationMinutes || 0), 0);
    const totalHours = Number((totalMinutes / 60).toFixed(2));
    const amountSpent = Number(
      timeLogs.reduce((acc, log) => acc + (log.amount || (log.durationMinutes / 60) * project.hourlyRate), 0).toFixed(2)
    );
    const budget = project.budget || 0;
    const remainingBudget = Number((budget - amountSpent).toFixed(2));
    const budgetUsagePercent = budget > 0 ? Number(((amountSpent / budget) * 100).toFixed(1)) : 0;
    const isOverBudget = budget > 0 && amountSpent > budget;

    const completedTasks = tasks.filter((t) => t.status === 'DONE').length;

    return {
      ...project.toObject(),
      tasks,
      timeLogs,
      calculations: {
        totalMinutes,
        totalHours,
        amountSpent,
        remainingBudget,
        budgetUsagePercent,
        isOverBudget,
        totalTasks: tasks.length,
        completedTasks,
      },
    };
  }

  static async createProject(data: Partial<IProject>, userId: string) {
    // Multi-tenancy check: verify client belongs to user
    const client = await Client.findOne({ _id: data.client, user: userId });
    if (!client) {
      throw new AppError('Invalid client: client does not exist or does not belong to you.', 400);
    }

    const project = await Project.create({
      ...data,
      user: userId,
      hourlyRate: data.hourlyRate !== undefined ? data.hourlyRate : client.defaultHourlyRate || 60,
    });

    return project.populate('client', 'name companyName currency');
  }

  static async updateProject(id: string, data: Partial<IProject>, userId: string) {
    if (data.client) {
      const client = await Client.findOne({ _id: data.client, user: userId });
      if (!client) {
        throw new AppError('Invalid client specified for update.', 400);
      }
    }

    const { client, name, description, status, budget, hourlyRate, startDate, deadline } = data;
    const project = await Project.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { client, name, description, status, budget, hourlyRate, startDate, deadline } },
      { returnDocument: 'after', runValidators: true }
    ).populate('client', 'name companyName currency');

    if (!project) {
      throw new AppError('Project not found or you do not have permission to modify it.', 404);
    }

    return project;
  }

  static async deleteProject(id: string, userId: string) {
    const project = await Project.findOne({ _id: id, user: userId });
    if (!project) {
      throw new AppError('Project not found or you do not have permission to delete it.', 404);
    }

    // Check if project has billed time logs
    const billedLogs = await TimeLog.countDocuments({ user: userId, project: id, isBilled: true });
    if (billedLogs > 0) {
      throw new AppError(
        `Cannot delete project with ${billedLogs} billed time logs attached to invoices.`,
        400
      );
    }

    // Cascade delete tasks and unbilled time logs
    await Promise.all([
      Task.deleteMany({ user: userId, project: id }),
      TimeLog.deleteMany({ user: userId, project: id, isBilled: false }),
      Project.deleteOne({ _id: id, user: userId }),
    ]);

    return { success: true, message: 'Project and associated tasks/unbilled logs deleted successfully.' };
  }
}
