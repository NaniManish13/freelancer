import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { AuthRequest } from '../middleware/auth.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;
      const { user, token } = await AuthService.register(name, email, password);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const { user, token } = await AuthService.login(email, password);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie('token');
      res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully.' },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const user = await AuthService.getMe(req.user.id);
      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePlan(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }
      const { plan } = req.body;
      if (!['FREE', 'PRO'].includes(plan)) {
        res.status(400).json({ success: false, message: 'Plan must be FREE or PRO' });
        return;
      }

      const user = await AuthService.updatePlan(req.user.id, plan);
      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const user = await AuthService.updateProfile(req.user.id, { name: req.body.name });
      res.status(200).json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  }
}
