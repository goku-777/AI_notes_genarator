import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/User.model';
import Meeting from '../models/Meeting.model';
import Recording from '../models/Recording.model';
import Transcript from '../models/Transcript.model';
import Summary from '../models/Summary.model';
import ActionItem from '../models/ActionItem.model';
import Notes from '../models/Notes.model';
import { ApiError } from '../utils/ApiError';
import { sendResponse } from '../utils/apiResponse';
import { uploadBufferToCloudinary } from '../services/cloudinary.service';

/**
 * @route   PUT /api/users/profile
 * @desc    Update name and/or email
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, email } = req.body;

  const user = await User.findById(req.userId);
  if (!user) throw ApiError.notFound('User not found');

  if (name) user.name = name;
  if (email) user.email = email.toLowerCase();

  await user.save();

  sendResponse(res, 200, 'Profile updated successfully', { user: user.toJSON() });
});

/**
 * @route   PUT /api/users/password
 * @desc    Update password (requires current password)
 * @access  Private
 */
export const updatePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.userId).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.unauthorized('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  sendResponse(res, 200, 'Password updated successfully');
});

/**
 * @route   PUT /api/users/profile-picture
 * @desc    Upload and set a new profile picture
 * @access  Private
 */
export const updateProfilePicture = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('No image file provided');
  }

  const user = await User.findById(req.userId);
  if (!user) throw ApiError.notFound('User not found');

  const result = await uploadBufferToCloudinary(req.file.buffer, 'ai-notes/profile-pictures', 'image');

  user.profilePicture = result.url;
  await user.save();

  sendResponse(res, 200, 'Profile picture updated successfully', { user: user.toJSON() });
});

/**
 * @route   DELETE /api/users/account
 * @desc    Permanently delete the authenticated user's account
 * @access  Private
 */
export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) throw ApiError.notFound('User not found');

  // Soft delete all meetings owned by this user; full cascade cleanup
  // (recordings/transcripts/etc.) is handled by a cleanup job in production.
  await Meeting.updateMany({ user: user.id }, { isDeleted: true, deletedAt: new Date() });
  await User.findByIdAndDelete(user.id);

  sendResponse(res, 200, 'Account deleted successfully');
});

/**
 * @route   GET /api/users/stats
 * @desc    Get dashboard statistics for the authenticated user
 * @access  Private
 */
export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  const meetings = await Meeting.find({ user: req.userId, isDeleted: false }).select('_id');
  const meetingIds = meetings.map((m) => m._id);

  const totalMeetings = meetingIds.length;

  const recordings = await Recording.find({ meeting: { $in: meetingIds } }).select('_id');
  const recordingIds = recordings.map((r) => r._id);

  const transcripts = await Transcript.find({ recording: { $in: recordingIds } }).select('_id');
  const transcriptIds = transcripts.map((t) => t._id);

  const summaries = await Summary.find({ transcript: { $in: transcriptIds } }).select('_id');
  const summaryIds = summaries.map((s) => s._id);

  const [totalNotes, totalSummaries, totalActionItems, pendingActionItems] = await Promise.all([
    Notes.countDocuments({ meeting: { $in: meetingIds } }),
    Summary.countDocuments({ transcript: { $in: transcriptIds } }),
    ActionItem.countDocuments({ summary: { $in: summaryIds } }),
    ActionItem.countDocuments({ summary: { $in: summaryIds }, status: { $ne: 'completed' } }),
  ]);

  sendResponse(res, 200, 'Stats fetched successfully', {
    totalMeetings,
    totalNotes,
    totalSummaries,
    totalActionItems,
    pendingActionItems,
  });
});
