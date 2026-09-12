import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'An internal server error occurred';

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val: any) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', '),
    });
  }

  // Handle Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    });
  }

  // Handle MongoDB connection / offline errors gracefully
  if (
    err.name === 'MongooseError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoServerSelectionError' ||
    (err.message && (err.message.includes('buffering timed out') || err.message.includes('ECONNREFUSED')))
  ) {
    console.warn('[AI Studio] Database offline or connection issue — returning fallback response');
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        data: req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {},
        message: 'Database temporarily unavailable.',
      });
    }
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable (database offline).',
    });
  }

  // Handle CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource ID.',
    });
  }

  if (statusCode >= 500 && !(err instanceof AppError)) {
    message = 'An internal server error occurred';
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
