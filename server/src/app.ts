import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import timeLogRoutes from './routes/timeLogRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import sampleDataRoutes from './routes/sampleDataRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Trust proxy for containerized / Cloud Run environment
  app.set('trust proxy', 1);

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows iframe embedding in AI Studio & local preview
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS configuration
  const isProduction = process.env.NODE_ENV === 'production';
  const clientUrlEnv = process.env.CLIENT_URL;

  // Normalize allowed origins from CLIENT_URL (supports comma-separated values)
  const allowedOrigins: string[] = [];
  if (clientUrlEnv) {
    clientUrlEnv.split(',').forEach((url) => {
      const normalized = url.trim().replace(/\/+$/, '');
      if (normalized) {
        allowedOrigins.push(normalized);
      }
    });
  }

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, or same-origin)
        if (!origin) {
          return callback(null, true);
        }

        if (isProduction) {
          if (allowedOrigins.length === 0) {
            // Missing CLIENT_URL in production: reject cross-origin requests securely
            return callback(new Error('CORS policy: CLIENT_URL is not configured on the server.'));
          }

          const normalizedOrigin = origin.replace(/\/+$/, '');
          if (allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
          }

          return callback(new Error(`CORS policy: Request from origin ${origin} has been blocked.`));
        }

        // In development mode: allow local dev / preview origins
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Favicon handler to eliminate 404 console errors in browser
  app.get('/favicon.ico', (_req, res) => {
    res.status(204).end();
  });

  // Logging in dev (only for API routes to avoid logging Vite frontend assets)
  if (process.env.NODE_ENV !== 'production') {
    app.use('/api', morgan('dev'));
  }

  // Rate Limiting (1000 requests per 15 minutes in sandbox/dev to ensure fluid UX while securing endpoints)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, message: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: {
      xForwardedForHeader: false,
      forwardedHeader: false,
    },
  });
  app.use('/api', limiter);

  // Body and cookie parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), app: 'FreelanceFlow API' });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/time-logs', timeLogRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/sample-data', sampleDataRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
