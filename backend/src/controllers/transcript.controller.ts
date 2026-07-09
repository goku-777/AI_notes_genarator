import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Meeting from '../models/Meeting.model';
import Recording from '../models/Recording.model';
import Transcript from '../models/Transcript.model';
import { ApiError } from '../utils/ApiError';
import { sendResponse } from '../utils/apiResponse';
import { transcribeAudioFromUrl } from '../services/whisper.service';

/**
 * @route   POST /api/transcripts/:meetingId/generate
 * @desc    Generate a transcript for a meeting's recording using Whisper
 * @access  Private
 */
export const generateTranscript = asyncHandler(async (req: Request, res: Response) => {
  const { meetingId } = req.params;

  const meeting = await Meeting.findOne({ _id: meetingId, user: req.userId });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  const recording = await Recording.findOne({ meeting: meeting._id });
  if (!recording) throw ApiError.notFound('No recording found for this meeting. Upload audio first.');

  const { text, language } = await transcribeAudioFromUrl(
    recording.filePath,
    recording.originalFileName || 'audio.mp3'
  );

  let transcript = await Transcript.findOne({ recording: recording._id });

  if (transcript) {
    transcript.transcriptText = text;
    transcript.language = language || transcript.language;
    transcript.isEdited = false;
    transcript.editedAt = undefined;
    await transcript.save();
  } else {
    transcript = await Transcript.create({
      recording: recording._id,
      transcriptText: text,
      language: language || 'en',
    });
  }

  meeting.status = 'processing';
  await meeting.save();

  sendResponse(res, 201, 'Transcript generated successfully', { transcript });
});

/**
 * @route   GET /api/transcripts/:meetingId
 * @desc    Get the transcript for a meeting
 * @access  Private
 */
export const getTranscript = asyncHandler(async (req: Request, res: Response) => {
  const { meetingId } = req.params;

  const meeting = await Meeting.findOne({ _id: meetingId, user: req.userId });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  const recording = await Recording.findOne({ meeting: meeting._id });
  if (!recording) throw ApiError.notFound('No recording found for this meeting');

  const transcript = await Transcript.findOne({ recording: recording._id });
  if (!transcript) throw ApiError.notFound('Transcript not found. Generate it first.');

  sendResponse(res, 200, 'Transcript fetched successfully', { transcript });
});

/**
 * @route   PUT /api/transcripts/:meetingId
 * @desc    Edit and save transcript text manually
 * @access  Private
 */
export const updateTranscript = asyncHandler(async (req: Request, res: Response) => {
  const { meetingId } = req.params;
  const { transcriptText } = req.body;

  const meeting = await Meeting.findOne({ _id: meetingId, user: req.userId });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  const recording = await Recording.findOne({ meeting: meeting._id });
  if (!recording) throw ApiError.notFound('No recording found for this meeting');

  const transcript = await Transcript.findOne({ recording: recording._id });
  if (!transcript) throw ApiError.notFound('Transcript not found. Generate it first.');

  transcript.transcriptText = transcriptText;
  transcript.isEdited = true;
  transcript.editedAt = new Date();
  await transcript.save();

  sendResponse(res, 200, 'Transcript updated successfully', { transcript });
});
