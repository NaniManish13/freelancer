import mongoose from 'mongoose';
import { TimeLog, ITimeLog } from '../models/TimeLog.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { AppError } from '../middleware/errorHandler.js';

export class TimeLogService {
  static async getTimeLogs(
    userId: string,
    filters: { project?: string; isBilled?: boolean | string; startDate?: string; endDate?: string } = {}
  ) {
    const query: any = { user: userId };
    if (filters.project) query.project = filters.project;
    if (filters.isBilled !== undefined && filters.isBilled !== '') {
      query.isBilled = filters.isBilled === 'true' || filters.isBilled === true;
    }
    if (filters.startDate || filters.endDate) {
      query.startTime = {};
      if (filters.startDate) query.startTime.$gte = new Date(filters.startDate);
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        query.startTime.$lte = end;
      }
    }

    const logs = await TimeLog.find(query)
      .populate({
        path: 'project',
        select: 'name hourlyRate client',
        populate: { path: 'client', select: 'name companyName currency' },
      })
      .populate('task', 'title status priority')
      .populate('invoice', 'invoiceNumber status')
      .sort({ startTime: -1 });

    return logs;
  }

  static async getUnbilledLogs(
    userId: string,
    clientId: string,
    startDate?: string,
    endDate?: string
  ) {
    // Find all projects belonging to this user and client
    const projects = await Project.find({ user: userId, client: clientId });
    const projectIds = projects.map((p) => p._id);

    const query: any = {
      user: userId,
      project: { $in: projectIds },
      isBilled: false,
    };

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.startTime.$lte = end;
      }
    }

    const unbilledLogs = await TimeLog.find(query)
      .populate('project', 'name hourlyRate')
      .populate('task', 'title')
      .sort({ startTime: 1 });

    return unbilledLogs;
  }

  static async createTimeLog(
    data: {
      projectId: string;
      taskId?: string;
      startTime: string | Date;
      endTime: string | Date;
      description?: string;
      hourlyRate?: number;
    },
    userId: string
  ) {
    // Multi-tenancy check: verify project belongs to user
    const project = await Project.findOne({ _id: data.projectId, user: userId });
    if (!project) {
      throw new AppError('Invalid project: project not found or does not belong to you.', 400);
    }

    // If task provided, verify task belongs to user and project
    if (data.taskId) {
      const task = await Task.findOne({ _id: data.taskId, user: userId, project: data.projectId });
      if (!task) {
        throw new AppError('Invalid task: task not found or does not belong to this project.', 400);
      }
    }

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError('Invalid start or end time format.', 400);
    }

    if (end <= start) {
      throw new AppError('End time must be greater than start time.', 400);
    }

    const durationMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
    const effectiveRate = data.hourlyRate !== undefined && data.hourlyRate > 0
      ? data.hourlyRate
      : project.hourlyRate || 60;

    const amount = Number(((durationMinutes / 60) * effectiveRate).toFixed(2));

    const timeLog = await TimeLog.create({
      user: userId,
      project: data.projectId,
      task: data.taskId || undefined,
      startTime: start,
      endTime: end,
      durationMinutes,
      description: data.description || 'General development / project work',
      hourlyRate: effectiveRate,
      amount,
      isBilled: false,
    });

    return timeLog.populate([
      { path: 'project', select: 'name hourlyRate client', populate: { path: 'client', select: 'name currency' } },
      { path: 'task', select: 'title' },
    ]);
  }

  static async updateTimeLog(
    id: string,
    data: {
      startTime?: string | Date;
      endTime?: string | Date;
      description?: string;
      hourlyRate?: number;
      taskId?: string;
      projectId?: string;
    },
    userId: string
  ) {
    const existing = await TimeLog.findOne({ _id: id, user: userId });
    if (!existing) {
      throw new AppError('Time log not found or access denied.', 404);
    }

    if (existing.isBilled) {
      throw new AppError('Cannot modify a time log that has already been billed on an invoice.', 400);
    }

    let start = existing.startTime;
    let end = existing.endTime;

    if (data.startTime) start = new Date(data.startTime);
    if (data.endTime) end = new Date(data.endTime);

    if (data.taskId !== undefined) {
      const task = await Task.findOne({
        _id: data.taskId,
        user: userId,
        project: existing.project,
      });
      if (!task) {
        throw new AppError('Invalid task: task not found or does not belong to this project.', 400);
      }
    }

    if (end <= start) {
      throw new AppError('End time must be after start time.', 400);
    }

    const durationMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
    const rate = data.hourlyRate !== undefined ? data.hourlyRate : existing.hourlyRate;
    const amount = Number(((durationMinutes / 60) * rate).toFixed(2));

    const updated = await TimeLog.findOneAndUpdate(
      { _id: id, user: userId },
      {
        $set: {
          startTime: start,
          endTime: end,
          durationMinutes,
          hourlyRate: rate,
          amount,
          description: data.description !== undefined ? data.description : existing.description,
          task: data.taskId !== undefined ? data.taskId : existing.task,
        },
      },
      { returnDocument: 'after', runValidators: true }
    ).populate([
      { path: 'project', select: 'name hourlyRate client', populate: { path: 'client', select: 'name currency' } },
      { path: 'task', select: 'title' },
    ]);

    return updated;
  }

  static async deleteTimeLog(id: string, userId: string) {
    const log = await TimeLog.findOne({ _id: id, user: userId });
    if (!log) {
      throw new AppError('Time log not found or access denied.', 404);
    }

    if (log.isBilled) {
      throw new AppError('Cannot delete a time log that has already been billed.', 400);
    }

    await TimeLog.deleteOne({ _id: id, user: userId });
    return { success: true, message: 'Time log deleted successfully.' };
  }
}
