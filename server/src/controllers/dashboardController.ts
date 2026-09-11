import { Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboardService.js';
import { AuthRequest } from '../middleware/auth.js';

export class DashboardController {
  static async getDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await DashboardService.getDashboardData(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
