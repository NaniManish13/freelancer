import { Response, NextFunction } from 'express';
import { TimeLogService } from '../services/timeLogService.js';
import { AuthRequest } from '../middleware/auth.js';

export class TimeLogController {
  static async getTimeLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { project, isBilled, startDate, endDate } = req.query;
      const logs = await TimeLogService.getTimeLogs(req.user!.id, {
        project: project as string,
        isBilled: isBilled as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      res.status(200).json({ success: true, data: { timeLogs: logs } });
    } catch (error) {
      next(error);
    }
  }

  static async getUnbilledLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId, startDate, endDate } = req.query;
      if (!clientId) {
        res.status(400).json({ success: false, message: 'clientId query param is required' });
        return;
      }
      const logs = await TimeLogService.getUnbilledLogs(
        req.user!.id,
        clientId as string,
        startDate as string,
        endDate as string
      );
      res.status(200).json({ success: true, data: { timeLogs: logs } });
    } catch (error) {
      next(error);
    }
  }

  static async createTimeLog(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await TimeLogService.createTimeLog(req.body, req.user!.id);
      res.status(201).json({ success: true, data: { timeLog: log } });
    } catch (error) {
      next(error);
    }
  }

  static async updateTimeLog(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await TimeLogService.updateTimeLog(req.params.id, req.body, req.user!.id);
      res.status(200).json({ success: true, data: { timeLog: log } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTimeLog(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TimeLogService.deleteTimeLog(req.params.id, req.user!.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
