import { Response, NextFunction } from 'express';
import { SampleDataService } from '../services/sampleDataService.js';
import { AuthRequest } from '../middleware/auth.js';

export class SampleDataController {
  static async loadSampleData(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SampleDataService.loadSampleDataForUser(req.user!.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async clearSampleData(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SampleDataService.clearDataForUser(req.user!.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
