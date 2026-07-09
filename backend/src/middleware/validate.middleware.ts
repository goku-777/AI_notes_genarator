import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError';

/**
 * Runs after express-validator chains; collects validation errors
 * and throws a single formatted ApiError if any field failed validation.
 */
export const validateRequest = (req: Request, _res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors
      .array()
      .map((e) => ('msg' in e ? e.msg : 'Invalid input'))
      .join('. ');
    throw ApiError.badRequest(messages);
  }

  next();
};
