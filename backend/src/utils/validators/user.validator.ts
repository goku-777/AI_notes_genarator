import { body } from 'express-validator';

export const updateProfileValidator = [
  body('name').optional().trim().isLength({ max: 100 }),
  body('email').optional().trim().isEmail().withMessage('Please provide a valid email'),
];

export const updatePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
];
