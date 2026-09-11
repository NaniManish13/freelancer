import { body, param, query } from 'express-validator';

export const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

export const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const profileValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
];

export const clientValidator = [
  body('name').trim().notEmpty().withMessage('Client name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid client email is required'),
  body('defaultHourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Default hourly rate must be a positive number'),
];

export const projectValidator = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('client').isMongoId().withMessage('Valid client ID is required'),
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'COMPLETED', 'PAUSED'])
    .withMessage('Status must be ACTIVE, COMPLETED, or PAUSED'),
];

export const taskValidator = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('project').isMongoId().withMessage('Valid project ID is required'),
  body('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'DONE'])
    .withMessage('Status must be TODO, IN_PROGRESS, or DONE'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH'])
    .withMessage('Priority must be LOW, MEDIUM, or HIGH'),
];

export const timeLogValidator = [
  body('projectId').isMongoId().withMessage('Valid project ID is required'),
  body('startTime').isISO8601().withMessage('Valid start time ISO date is required'),
  body('endTime').isISO8601().withMessage('Valid end time ISO date is required'),
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be positive'),
];

export const invoiceValidator = [
  body('clientId').isMongoId().withMessage('Valid client ID is required'),
  body('dueDate').isISO8601().withMessage('Valid due date ISO date is required'),
  body('taxPercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax percentage must be between 0 and 100'),
];
