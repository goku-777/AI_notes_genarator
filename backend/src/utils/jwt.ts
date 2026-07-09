import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';

export interface TokenPayload {
  userId: string;
}

/**
 * Generates a short-lived access token for API authentication.
 */
export const generateAccessToken = (userId: string): string => {
  const payload: TokenPayload = { userId };
  const options: SignOptions = { expiresIn: config.jwtExpiresIn as any };
  return jwt.sign(payload, config.jwtSecret, options);
};

/**
 * Generates a long-lived refresh token used to obtain new access tokens.
 */
export const generateRefreshToken = (userId: string): string => {
  const payload: TokenPayload = { userId };
  const options: SignOptions = { expiresIn: config.jwtRefreshExpiresIn as any };
  return jwt.sign(payload, config.jwtRefreshSecret, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtRefreshSecret) as TokenPayload;
};

export const generateAuthTokens = (userId: string) => ({
  accessToken: generateAccessToken(userId),
  refreshToken: generateRefreshToken(userId),
});
