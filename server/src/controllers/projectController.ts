import { Response, NextFunction } from 'express';
import { ProjectService } from '../services/projectService.js';
import { AuthRequest } from '../middleware/auth.js';

export class ProjectController {
  static async getProjects(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, client, search } = req.query;
      const projects = await ProjectService.getProjects(req.user!.id, {
        status: status as string,
        client: client as string,
        search: search as string,
      });
      res.status(200).json({ success: true, data: { projects } });
    } catch (error) {
      next(error);
    }
  }

  static async getProjectById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await ProjectService.getProjectById(req.params.id, req.user!.id);
      res.status(200).json({ success: true, data: { project } });
    } catch (error) {
      next(error);
    }
  }

  static async createProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await ProjectService.createProject(req.body, req.user!.id);
      res.status(201).json({ success: true, data: { project } });
    } catch (error) {
      next(error);
    }
  }

  static async updateProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await ProjectService.updateProject(req.params.id, req.body, req.user!.id);
      res.status(200).json({ success: true, data: { project } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProjectService.deleteProject(req.params.id, req.user!.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
