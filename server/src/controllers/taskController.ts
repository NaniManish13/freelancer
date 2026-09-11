import { Response, NextFunction } from 'express';
import { TaskService } from '../services/taskService.js';
import { AuthRequest } from '../middleware/auth.js';

export class TaskController {
  static async getTasks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { project, status, priority, search } = req.query;
      const tasks = await TaskService.getTasks(req.user!.id, {
        project: project as string,
        status: status as string,
        priority: priority as string,
        search: search as string,
      });
      res.status(200).json({ success: true, data: { tasks } });
    } catch (error) {
      next(error);
    }
  }

  static async getTaskById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await TaskService.getTaskById(req.params.id, req.user!.id);
      res.status(200).json({ success: true, data: { task } });
    } catch (error) {
      next(error);
    }
  }

  static async createTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await TaskService.createTask(req.body, req.user!.id);
      res.status(201).json({ success: true, data: { task } });
    } catch (error) {
      next(error);
    }
  }

  static async updateTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await TaskService.updateTask(req.params.id, req.body, req.user!.id);
      res.status(200).json({ success: true, data: { task } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TaskService.deleteTask(req.params.id, req.user!.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
