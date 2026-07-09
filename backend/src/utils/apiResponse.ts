import { Response } from 'express';

interface ApiResponseShape<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

/**
 * Sends a standardized JSON response shape across the entire API.
 */
export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  meta?: Record<string, unknown>
): Response => {
  const body: ApiResponseShape<T> = {
    success: statusCode < 400,
    message,
  };
  if (data !== undefined) body.data = data;
  if (meta !== undefined) body.meta = meta;

  return res.status(statusCode).json(body);
};
