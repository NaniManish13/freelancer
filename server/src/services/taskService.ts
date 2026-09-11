import { Task, ITask } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { AppError } from '../middleware/errorHandler.js';

export class TaskService {
  static async getTasks(
    userId: string,
    filters: { project?: string; status?: string; priority?: string; search?: string } = {}
  ) {
    const query: any = { user: userId };
    if (filters.project) query.project = filters.project;
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.search) query.title = { $regex: filters.search, $options: 'i' };

    const tasks = await Task.find(query)
      .populate({
        path: 'project',
        select: 'name status hourlyRate client',
        populate: { path: 'client', select: 'name currency' },
      })
      .sort({ dueDate: 1, createdAt: -1 });

    return tasks;
  }

  static async getTaskById(id: string, userId: string) {
    const task = await Task.findOne({ _id: id, user: userId }).populate({
      path: 'project',
      select: 'name status hourlyRate client',
      populate: { path: 'client', select: 'name currency' },
    });

    if (!task) {
      throw new AppError('Task not found or access denied.', 404);
    }
    return task;
  }

  static async createTask(data: Partial<ITask>, userId: string) {
    // Multi-tenancy check: verify project exists and belongs to user
    const project = await Project.findOne({ _id: data.project, user: userId });
    if (!project) {
      throw new AppError('Invalid project: project not found or does not belong to you.', 400);
    }

    const task = await Task.create({
      ...data,
      user: userId,
    });

    return task.populate('project', 'name status');
  }

  static async updateTask(id: string, data: Partial<ITask>, userId: string) {
    if (data.project) {
      const project = await Project.findOne({ _id: data.project, user: userId });
      if (!project) {
        throw new AppError('Invalid project specified.', 400);
      }
    }

    const { project, title, description, status, priority, dueDate } = data;
    const task = await Task.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { project, title, description, status, priority, dueDate } },
      { returnDocument: 'after', runValidators: true }
    ).populate('project', 'name status');

    if (!task) {
      throw new AppError('Task not found or access denied.', 404);
    }
    return task;
  }

  static async deleteTask(id: string, userId: string) {
    const task = await Task.findOneAndDelete({ _id: id, user: userId });
    if (!task) {
      throw new AppError('Task not found or access denied.', 404);
    }
    return { success: true, message: 'Task deleted successfully.' };
  }
}
