import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => err.msg);
    res.status(400).json({
      success: false,
      message: extractedErrors[0] || 'Invalid input data',
      errors: errors.array(),
    });
    return;
  }
  next();
};
