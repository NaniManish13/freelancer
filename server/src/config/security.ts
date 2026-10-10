import { AppError } from '../middleware/errorHandler.js';

export const isProductionEnvironment = (): boolean =>
  process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

export const configureJwtSecret = (): void => {
  if (isProductionEnvironment() && (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '')) {
    throw new Error('JWT_SECRET is required in production. Set the environment variable before starting the server.');
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
    console.warn('[FreelanceFlow] Notice: JWT_SECRET environment variable is not configured. Using a local-only development secret.');
    process.env.JWT_SECRET = 'local-dev-only-jwt-secret-change-me';
  }
};

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('Server authentication configuration error: JWT_SECRET is not configured.', 500);
  }
  return secret;
};
