import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Meeting from '../models/Meeting.model';
import Recording from '../models/Recording.model';
import Transcript from '../models/Transcript.model';
import Summary from '../models/Summary.model';
import ActionItem from '../models/ActionItem.model';
import Notes from '../models/Notes.model';
import { ApiError } from '../utils/ApiError';
import { sendResponse } from '../utils/apiResponse';
import { generateMeetingSummary } from '../services/gemini.service';

/**
 * Resolves the recording -> transcript chain for a meeting owned by the user.
 */
const getOwnedTranscript = async (meetingId: string, userId: string) => {
  const meeting = await Meeting.findOne({ _id: meetingId, user: userId });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  const recording = await Recording.findOne({ meeting: meeting._id });
  if (!recording) throw ApiError.notFound('No recording found for this meeting');

  const transcript = await Transcript.findOne({ recording: recording._id });
  if (!transcript) throw ApiError.notFound('Transcript not found. Generate it first.');

  return { meeting, transcript };
};

/**
 * @route   POST /api/summaries/:meetingId/generate
 * @desc    Generate an AI summary, action items, and an initial notes draft
 * @access  Private
 */
export const generateSummary = asyncHandler(async (req: Request, res: Response) => {
  const { meetingId } = req.params;
  const { meeting, transcript } = await getOwnedTranscript(meetingId, req.userId!);

  const aiResult = await generateMeetingSummary(transcript.transcriptText);

  // Remove any prior summary chain to keep one-summary-per-transcript invariant
  let summary = await Summary.findOne({ transcript: transcript._id });
  if (summary) {
    await ActionItem.deleteMany({ summary: summary._id });
    await Notes.deleteMany({ summary: summary._id });
    await summary.deleteOne();
  }

  summary = await Summary.create({
    transcript: transcript._id,
    summaryText: aiResult.summaryText,
    meetingOverview: aiResult.meetingOverview,
    keyDiscussionPoints: aiResult.keyDiscussionPoints,
    importantDecisions: aiResult.importantDecisions,
    nextSteps: aiResult.nextSteps,
    risks: aiResult.risks,
    highlights: aiResult.highlights,
    smartTitle: aiResult.smartTitle,
    keywords: aiResult.keywords,
    tags: aiResult.tags,
    generatedAt: new Date(),
  });

  const actionItems = await ActionItem.insertMany(
    aiResult.actionItems.map((item) => ({
      summary: summary!._id,
      task: item.task,
      assignee: item.assignee || '',
      deadline: item.deadline ? new Date(item.deadline) : undefined,
      priority: item.priority || 'medium',
      status: 'pending',
    }))
  );

  // Auto-generate an initial notes draft from the summary markdown
  const notes = await Notes.create({
    summary: summary._id,
    meeting: meeting._id,
    noteContent: aiResult.summaryText,
    editedAt: new Date(),
  });

  meeting.status = 'completed';
  meeting.keywords = aiResult.keywords;
  meeting.tags = aiResult.tags;
  if (!meeting.title || meeting.title.startsWith('Meeting - ')) {
    meeting.title = aiResult.smartTitle;
  }
  await meeting.save();

  sendResponse(res, 201, 'Summary generated successfully', {
    summary,
    actionItems,
    notes,
    meeting,
  });
});

/**
 * @route   GET /api/summaries/:meetingId
 * @desc    Get the summary (with action items) for a meeting
 * @access  Private
 */
export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const { meetingId } = req.params;
  const { transcript } = await getOwnedTranscript(meetingId, req.userId!);

  const summary = await Summary.findOne({ transcript: transcript._id });
  if (!summary) throw ApiError.notFound('Summary not found. Generate it first.');

  const actionItems = await ActionItem.find({ summary: summary._id }).sort({ createdAt: 1 });

  sendResponse(res, 200, 'Summary fetched successfully', { summary, actionItems });
});

/**
 * @route   PUT /api/summaries/:meetingId
 * @desc    Manually edit summary fields
 * @access  Private
 */
export const updateSummary = asyncHandler(async (req: Request, res: Response) => {
  const { meetingId } = req.params;
  const { transcript } = await getOwnedTranscript(meetingId, req.userId!);

  const summary = await Summary.findOne({ transcript: transcript._id });
  if (!summary) throw ApiError.notFound('Summary not found');

  const allowedFields = [
    'summaryText',
    'meetingOverview',
    'keyDiscussionPoints',
    'importantDecisions',
    'nextSteps',
    'risks',
    'highlights',
    'smartTitle',
    'keywords',
    'tags',
  ] as const;

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      (summary as any)[field] = req.body[field];
    }
  });

  await summary.save();

  sendResponse(res, 200, 'Summary updated successfully', { summary });
});
