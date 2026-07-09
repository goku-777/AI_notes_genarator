import { body, param } from 'express-validator';

export const createMeetingValidator = [
  body('title').optional().trim().isLength({ max: 200 }),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO date'),
];

export const updateMeetingValidator = [
  param('id').isMongoId().withMessage('Invalid meeting id'),
  body('title').optional().trim().isLength({ max: 200 }),
  body('date').optional().isISO8601(),
  body('tags').optional().isArray(),
];

export const mongoIdParamValidator = [param('id').isMongoId().withMessage('Invalid id')];
