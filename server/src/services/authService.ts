import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { getJwtSecret, isProductionEnvironment } from '../config/security.js';
const JWT_EXPIRES_IN = '7d';

export class AuthService {
  static generateToken(userId: string): string {
    return jwt.sign({ id: userId }, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
  }

  static async register(name: string, email: string, password: string): Promise<{ user: Partial<IUser>; token: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      throw new AppError('An account with this email already exists.', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      plan: 'FREE',
    });

    const token = this.generateToken(user._id.toString());

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  static async login(email: string, password: string): Promise<{ user: Partial<IUser>; token: string }> {
    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail });

    const allowDemoAuth = process.env.ALLOW_DEMO_AUTH === 'true';
    const isProduction = isProductionEnvironment();

    if (cleanEmail === 'demo@freelanceflow.dev' && isProduction && !allowDemoAuth) {
      throw new AppError('Demo authentication is disabled in production.', 403);
    }

    if (!user && cleanEmail === 'demo@freelanceflow.dev' && !isProduction && allowDemoAuth && (password === 'Demo123456!' || password === 'demo123456')) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Demo123456!', salt);
      user = await User.create({
        name: 'Alex Morgan',
        email: 'demo@freelanceflow.dev',
        passwordHash,
        plan: 'PRO',
      });
      try {
        const { SampleDataService } = await import('./sampleDataService.js');
        await SampleDataService.loadSampleDataForUser(user._id.toString());
      } catch (err) {
        console.warn('Demo sample data load notice:', err);
      }
    }

    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    let isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch && cleanEmail === 'demo@freelanceflow.dev' && !isProduction && allowDemoAuth && (password === 'Demo123456!' || password === 'demo123456')) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash('Demo123456!', salt);
      await user.save();
      isMatch = true;
    }

    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const token = this.generateToken(user._id.toString());

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  static async getMe(userId: string): Promise<Partial<IUser>> {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    return user;
  }

  static async updatePlan(userId: string, plan: 'FREE' | 'PRO'): Promise<Partial<IUser>> {
    const user = await User.findByIdAndUpdate(
      userId,
      { plan },
      { returnDocument: 'after', runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      throw new AppError('User not found.', 404);
    }
    return user;
  }

  static async updateProfile(userId: string, data: { name: string }): Promise<Partial<IUser>> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { name: data.name.trim() } },
      { returnDocument: 'after', runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      throw new AppError('User not found.', 404);
    }
    return user;
  }
}
