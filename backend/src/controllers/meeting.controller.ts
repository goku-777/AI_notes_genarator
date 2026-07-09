import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Meeting from '../models/Meeting.model';
import Recording from '../models/Recording.model';
import Transcript from '../models/Transcript.model';
import Summary from '../models/Summary.model';
import Notes from '../models/Notes.model';
import ActionItem from '../models/ActionItem.model';
import { ApiError } from '../utils/ApiError';
import { sendResponse } from '../utils/apiResponse';

/**
 * @route   POST /api/meetings
 * @desc    Create a new meeting (the parent container for a recording)
 * @access  Private
 */
export const createMeeting = asyncHandler(async (req: Request, res: Response) => {
  const { title, date } = req.body;

  const meeting = await Meeting.create({
    user: req.userId,
    title: title || `Meeting - ${new Date().toLocaleDateString()}`,
    date: date || new Date(),
    status: 'pending',
  });

  sendResponse(res, 201, 'Meeting created successfully', { meeting });
});

/**
 * @route   GET /api/meetings
 * @desc    List meetings for the authenticated user with search/filter/sort/pagination
 * @access  Private
 * @query   search, status, sortBy, order, page, limit
 */
export const getMeetings = asyncHandler(async (req: Request, res: Response) => {
  const {
    search,
    status,
    sortBy = 'createdAt',
    order = 'desc',
    page = '1',
    limit = '10',
    includeDeleted = 'false',
  } = req.query as Record<string, string>;

  const query: Record<string, unknown> = { user: req.userId };

  if (includeDeleted !== 'true') {
    query.isDeleted = false;
  }

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$text = { $search: search };
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const sortOrder = order === 'asc' ? 1 : -1;
  const sortObj: Record<string, 1 | -1> = { [sortBy]: sortOrder };

  const [meetings, total] = await Promise.all([
    Meeting.find(query).sort(sortObj).skip(skip).limit(limitNum),
    Meeting.countDocuments(query),
  ]);

  sendResponse(res, 200, 'Meetings fetched successfully', meetings, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
});

/**
 * @route   GET /api/meetings/:id
 * @desc    Get a single meeting with its full chain (recording, transcript, summary, action items, notes)
 * @access  Private
 */
export const getMeetingById = asyncHandler(async (req: Request, res: Response) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, user: req.userId });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  const recording = await Recording.findOne({ meeting: meeting._id });
  let transcript: InstanceType<typeof Transcript> | null = null;
  let summary: InstanceType<typeof Summary> | null = null;
  let notes: InstanceType<typeof Notes> | null = null;

  if (recording) {
    transcript = await Transcript.findOne({ recording: recording._id });
  }
  if (transcript) {
    summary = await Summary.findOne({ transcript: transcript._id });
  }
  if (summary) {
    notes = await Notes.findOne({ summary: summary._id });
  }

  sendResponse(res, 200, 'Meeting fetched successfully', {
    meeting,
    recording,
    transcript,
    summary,
    notes,
  });
});

/**
 * @route   PUT /api/meetings/:id
 * @desc    Update meeting metadata (title, date, tags)
 * @access  Private
 */
export const updateMeeting = asyncHandler(async (req: Request, res: Response) => {
  const { title, date, tags } = req.body;

  const meeting = await Meeting.findOne({ _id: req.params.id, user: req.userId });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  if (title) meeting.title = title;
  if (date) meeting.date = date;
  if (tags) meeting.tags = tags;

  await meeting.save();

  sendResponse(res, 200, 'Meeting updated successfully', { meeting });
});

/**
 * @route   DELETE /api/meetings/:id
 * @desc    Soft-delete a meeting (moves it to trash, recoverable via restore)
 * @access  Private
 */
export const deleteMeeting = asyncHandler(async (req: Request, res: Response) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, user: req.userId });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  meeting.isDeleted = true;
  meeting.deletedAt = new Date();
  meeting.status = 'deleted';
  await meeting.save();

  sendResponse(res, 200, 'Meeting moved to trash');
});

/**
 * @route   PATCH /api/meetings/:id/restore
 * @desc    Restore a soft-deleted meeting
 * @access  Private
 */
export const restoreMeeting = asyncHandler(async (req: Request, res: Response) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, user: req.userId });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  meeting.isDeleted = false;
  meeting.deletedAt = undefined;
  meeting.status = 'completed';
  await meeting.save();

  sendResponse(res, 200, 'Meeting restored successfully', { meeting });
});

/**
 * @route   DELETE /api/meetings/:id/permanent
 * @desc    Permanently delete a meeting and its entire data chain
 * @access  Private
 */
export const permanentlyDeleteMeeting = asyncHandler(async (req: Request, res: Response) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, user: req.userId });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  const recording = await Recording.findOne({ meeting: meeting._id });
  if (recording) {
    const transcript = await Transcript.findOne({ recording: recording._id });
    if (transcript) {
      const summary = await Summary.findOne({ transcript: transcript._id });
      if (summary) {
        await Notes.deleteMany({ summary: summary._id });
        await ActionItem.deleteMany({ summary: summary._id });
        await summary.deleteOne();
      }
      await transcript.deleteOne();
    }
    await recording.deleteOne();
  }
  await meeting.deleteOne();

  sendResponse(res, 200, 'Meeting permanently deleted');
});
