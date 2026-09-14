import dotenv from 'dotenv';
import { createApp } from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';

dotenv.config();

// Ensure JWT_SECRET fallback
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
  console.warn('[FreelanceFlow] Notice: JWT_SECRET environment variable is not configured. Utilizing default secret.');
  process.env.JWT_SECRET = 'freelanceflow_secure_default_jwt_secret_key_2026';
}

let appInstance: any = null;

export default async function handler(req: any, res: any) {
  // 1. Maintain cached MongoDB connection across serverless invocations
  try {
    await connectDB();
  } catch (error: any) {
    console.error('Serverless database connection error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Database connection failed. Please verify MONGO_URI environment variable.',
    });
  }

  // 2. Initialize Express application singleton
  if (!appInstance) {
    appInstance = createApp();
  }

  // 3. Normalize URL path to ensure /api routes match regardless of rewrite prefix stripping
  if (req.url && !req.url.startsWith('/api') && req.url !== '/favicon.ico') {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }

  return appInstance(req, res);
}
