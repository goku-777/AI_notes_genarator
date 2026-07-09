import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Meeting from '../models/Meeting.model';
import Recording from '../models/Recording.model';
import { ApiError } from '../utils/ApiError';
import { sendResponse } from '../utils/apiResponse';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../services/cloudinary.service';

/**
 * @route   POST /api/recordings/:meetingId/upload
 * @desc    Upload an audio/video recording file for a meeting
 * @access  Private
 */
export const uploadRecording = asyncHandler(async (req: Request, res: Response) => {
  const { meetingId } = req.params;

  const meeting = await Meeting.findOne({ _id: meetingId, user: req.userId });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  if (!req.file) {
    throw ApiError.badRequest('No audio file provided');
  }

  const existing = await Recording.findOne({ meeting: meeting._id });
  if (existing) {
    // Replace existing recording: remove old file from storage first
    await deleteFromCloudinary(existing.cloudinaryPublicId, 'video');
    await existing.deleteOne();
  }

  const result = await uploadBufferToCloudinary(req.file.buffer, 'ai-notes/recordings', 'video');

  const recording = await Recording.create({
    meeting: meeting._id,
    filePath: result.url,
    cloudinaryPublicId: result.publicId,
    duration: result.duration || 0,
    recordingType: 'upload',
    fileSize: result.bytes,
    mimeType: req.file.mimetype,
    originalFileName: req.file.originalname,
  });

  meeting.status = 'processing';
  await meeting.save();

  sendResponse(res, 201, 'Recording uploaded successfully', { recording });
});

/**
 * @route   POST /api/recordings/:meetingId/live
 * @desc    Save a live in-browser recording (recorded via MediaRecorder, sent as blob)
 * @access  Private
 */
export const saveLiveRecording = asyncHandler(async (req: Request, res: Response) => {
  const { meetingId } = req.params;
  const { duration } = req.body;

  const meeting = await Meeting.findOne({ _id: meetingId, user: req.userId });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  if (!req.file) {
    throw ApiError.badRequest('No recorded audio blob provided');
  }

  const existing = await Recording.findOne({ meeting: meeting._id });
  if (existing) {
    await deleteFromCloudinary(existing.cloudinaryPublicId, 'video');
    await existing.deleteOne();
  }

  const result = await uploadBufferToCloudinary(req.file.buffer, 'ai-notes/recordings', 'video');

  const recording = await Recording.create({
    meeting: meeting._id,
    filePath: result.url,
    cloudinaryPublicId: result.publicId,
    duration: Number(duration) || result.duration || 0,
    recordingType: 'live',
    fileSize: result.bytes,
    mimeType: req.file.mimetype,
    originalFileName: 'live-recording.webm',
  });

  meeting.status = 'processing';
  await meeting.save();

  sendResponse(res, 201, 'Live recording saved successfully', { recording });
});

/**
 * @route   GET /api/recordings/:meetingId
 * @desc    Get the recording associated with a meeting
 * @access  Private
 */
export const getRecording = asyncHandler(async (req: Request, res: Response) => {
  const { meetingId } = req.params;

  const meeting = await Meeting.findOne({ _id: meetingId, user: req.userId });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  const recording = await Recording.findOne({ meeting: meeting._id });
  if (!recording) throw ApiError.notFound('Recording not found for this meeting');

  sendResponse(res, 200, 'Recording fetched successfully', { recording });
});

/**
 * @route   DELETE /api/recordings/:meetingId
 * @desc    Delete the recording for a meeting (also removes from Cloudinary)
 * @access  Private
 */
export const deleteRecording = asyncHandler(async (req: Request, res: Response) => {
  const { meetingId } = req.params;

  const meeting = await Meeting.findOne({ _id: meetingId, user: req.userId });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  const recording = await Recording.findOne({ meeting: meeting._id });
  if (!recording) throw ApiError.notFound('Recording not found');

  await deleteFromCloudinary(recording.cloudinaryPublicId, 'video');
  await recording.deleteOne();

  sendResponse(res, 200, 'Recording deleted successfully');
});
