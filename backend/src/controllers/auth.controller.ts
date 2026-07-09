import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import User from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { sendResponse } from '../utils/apiResponse';
import { generateAuthTokens, verifyRefreshToken, generateAccessToken } from '../utils/jwt';
import { sendPasswordResetEmail } from '../services/email.service';
import { config } from '../config/env';

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await User.create({ name, email, password });
  const tokens = generateAuthTokens(user.id);

  sendResponse(res, 201, 'Account created successfully', {
    user: user.toJSON(),
    ...tokens,
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return tokens
 * @access  Public
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const tokens = generateAuthTokens(user.id);

  sendResponse(res, 200, 'Login successful', {
    user: user.toJSON(),
    ...tokens,
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user. With stateless JWTs this is mainly a client-side
 *          token discard; endpoint exists for consistency and future
 *          token-blacklisting support.
 * @access  Private
 */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  sendResponse(res, 200, 'Logged out successfully');
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Exchange a valid refresh token for a new access token
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw ApiError.badRequest('Refresh token is required');
  }

  try {
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw ApiError.unauthorized('User no longer exists');
    }
    const accessToken = generateAccessToken(user.id);
    sendResponse(res, 200, 'Token refreshed', { accessToken });
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get the currently authenticated user
 * @access  Private
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  sendResponse(res, 200, 'User fetched successfully', { user: user.toJSON() });
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Generate a password reset token and email it to the user
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always respond with success to avoid leaking which emails are registered
  if (!user) {
    sendResponse(res, 200, 'If that email exists, a reset link has been sent.');
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
  await user.save();

  const resetUrl = `${config.clientUrl}/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail(user.email, user.name, resetUrl);
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    throw ApiError.internal('Failed to send password reset email. Please try again later.');
  }

  sendResponse(res, 200, 'If that email exists, a reset link has been sent.');
});

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password using a valid reset token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    throw ApiError.badRequest('Password reset token is invalid or has expired');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  const tokens = generateAuthTokens(user.id);

  sendResponse(res, 200, 'Password reset successfully', tokens);
});
