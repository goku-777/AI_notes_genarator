import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import User from '../models/User.model';

// Augment Express Request to carry the authenticated user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Verifies the Bearer JWT in the Authorization header and attaches
 * the authenticated user's id to the request object.
 */
export const protect = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Not authorized, no token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = verifyAccessToken(token);

      const user = await User.findById(decoded.userId);
      if (!user) {
        throw ApiError.unauthorized('User belonging to this token no longer exists');
      }

      req.userId = decoded.userId;
      next();
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw ApiError.unauthorized('Not authorized, token invalid or expired');
    }
  }
);
