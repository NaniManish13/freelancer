import { Response, NextFunction } from 'express';
import { ClientService } from '../services/clientService.js';
import { AuthRequest } from '../middleware/auth.js';

export class ClientController {
  static async getClients(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string;
      const clients = await ClientService.getClients(req.user!.id, search);
      res.status(200).json({ success: true, data: { clients } });
    } catch (error) {
      next(error);
    }
  }

  static async getClientById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const client = await ClientService.getClientById(req.params.id, req.user!.id);
      res.status(200).json({ success: true, data: { client } });
    } catch (error) {
      next(error);
    }
  }

  static async createClient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const client = await ClientService.createClient(req.body, req.user!.id, req.user!.plan);
      res.status(201).json({ success: true, data: { client } });
    } catch (error) {
      next(error);
    }
  }

  static async updateClient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const client = await ClientService.updateClient(req.params.id, req.body, req.user!.id);
      res.status(200).json({ success: true, data: { client } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteClient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ClientService.deleteClient(req.params.id, req.user!.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
