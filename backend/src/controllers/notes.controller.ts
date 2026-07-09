import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import Notes from '../models/Notes.model';
import Meeting from '../models/Meeting.model';
import { ApiError } from '../utils/ApiError';
import { sendResponse } from '../utils/apiResponse';
import { sendEmail } from '../services/email.service';
import { config } from '../config/env';

/**
 * @route   GET /api/notes/:meetingId
 * @desc    Get notes for a meeting
 * @access  Private
 */
export const getNotes = asyncHandler(async (req: Request, res: Response) => {
  const { meetingId } = req.params;

  const meeting = await Meeting.findOne({ _id: meetingId, user: req.userId });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  const notes = await Notes.findOne({ meeting: meeting._id });
  if (!notes) throw ApiError.notFound('Notes not found. Generate a summary first.');

  sendResponse(res, 200, 'Notes fetched successfully', { notes });
});

/**
 * @route   PUT /api/notes/:meetingId
 * @desc    Edit and save note content (supports autosave + manual save from the same endpoint)
 * @access  Private
 */
export const updateNotes = asyncHandler(async (req: Request, res: Response) => {
  const { meetingId } = req.params;
  const { noteContent } = req.body;

  const meeting = await Meeting.findOne({ _id: meetingId, user: req.userId });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  const notes = await Notes.findOne({ meeting: meeting._id });
  if (!notes) throw ApiError.notFound('Notes not found. Generate a summary first.');

  notes.noteContent = noteContent;
  notes.editedAt = new Date();
  await notes.save();

  sendResponse(res, 200, 'Notes saved successfully', { notes });
});

/**
 * @route   POST /api/notes/:meetingId/share
 * @desc    Generate (or rotate) a public share link for a note
 * @access  Private
 */
export const generateShareLink = asyncHandler(async (req: Request, res: Response) => {
  const { meetingId } = req.params;

  const meeting = await Meeting.findOne({ _id: meetingId, user: req.userId });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  const notes = await Notes.findOne({ meeting: meeting._id });
  if (!notes) throw ApiError.notFound('Notes not found');

  notes.shareToken = crypto.randomBytes(16).toString('hex');
  notes.isPublicShare = true;
  await notes.save();

  const shareUrl = `${config.clientUrl}/shared/${notes.shareToken}`;

  sendResponse(res, 200, 'Share link generated successfully', { shareUrl, shareToken: notes.shareToken });
});

/**
 * @route   DELETE /api/notes/:meetingId/share
 * @desc    Revoke a public share link
 * @access  Private
 */
export const revokeShareLink = asyncHandler(async (req: Request, res: Response) => {
  const { meetingId } = req.params;

  const meeting = await Meeting.findOne({ _id: meetingId, user: req.userId });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  const notes = await Notes.findOne({ meeting: meeting._id });
  if (!notes) throw ApiError.notFound('Notes not found');

  notes.shareToken = undefined;
  notes.isPublicShare = false;
  await notes.save();

  sendResponse(res, 200, 'Share link revoked successfully');
});

/**
 * @route   POST /api/notes/:meetingId/share/email
 * @desc    Email the share link to a recipient
 * @access  Private
 */
export const emailShareLink = asyncHandler(async (req: Request, res: Response) => {
  const { meetingId } = req.params;
  const { recipientEmail } = req.body;

  const meeting = await Meeting.findOne({ _id: meetingId, user: req.userId });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  const notes = await Notes.findOne({ meeting: meeting._id });
  if (!notes) throw ApiError.notFound('Notes not found');

  if (!notes.shareToken) {
    notes.shareToken = crypto.randomBytes(16).toString('hex');
    notes.isPublicShare = true;
    await notes.save();
  }

  const shareUrl = `${config.clientUrl}/shared/${notes.shareToken}`;

  await sendEmail({
    to: recipientEmail,
    subject: `Meeting notes shared with you: ${meeting.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background:#ffffff; border-radius:16px; border:1px solid #eee;">
        <h2 style="color:#1E1E1E;">${meeting.title}</h2>
        <p style="color:#444;">Someone shared meeting notes with you via AI Notes Generator.</p>
        <a href="${shareUrl}" style="display:inline-block; margin-top:16px; padding:12px 24px; background:#4F46E5; color:#fff; text-decoration:none; border-radius:10px; font-weight:600;">View Notes</a>
      </div>
    `,
  });

  sendResponse(res, 200, 'Notes shared via email successfully', { shareUrl });
});

/**
 * @route   GET /api/notes/shared/:shareToken
 * @desc    Public endpoint to view shared notes (no auth required)
 * @access  Public
 */
export const getSharedNotes = asyncHandler(async (req: Request, res: Response) => {
  const { shareToken } = req.params;

  const notes = await Notes.findOne({ shareToken, isPublicShare: true });
  if (!notes) throw ApiError.notFound('Shared note not found or sharing has been revoked');

  const meeting = await Meeting.findById(notes.meeting).select('title date');

  sendResponse(res, 200, 'Shared notes fetched successfully', { notes, meeting });
});
