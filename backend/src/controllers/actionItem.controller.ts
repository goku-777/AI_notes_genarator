import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import ActionItem from '../models/ActionItem.model';
import Summary from '../models/Summary.model';
import Transcript from '../models/Transcript.model';
import Recording from '../models/Recording.model';
import Meeting from '../models/Meeting.model';
import { ApiError } from '../utils/ApiError';
import { sendResponse } from '../utils/apiResponse';

/**
 * Verifies the action item belongs (via summary -> transcript -> recording -> meeting)
 * to the authenticated user before allowing mutation.
 */
const assertOwnership = async (actionItemId: string, userId: string) => {
  const actionItem = await ActionItem.findById(actionItemId);
  if (!actionItem) throw ApiError.notFound('Action item not found');

  const summary = await Summary.findById(actionItem.summary);
  if (!summary) throw ApiError.notFound('Parent summary not found');

  const transcript = await Transcript.findById(summary.transcript);
  if (!transcript) throw ApiError.notFound('Parent transcript not found');

  const recording = await Recording.findById(transcript.recording);
  if (!recording) throw ApiError.notFound('Parent recording not found');

  const meeting = await Meeting.findOne({ _id: recording.meeting, user: userId });
  if (!meeting) throw ApiError.forbidden('You do not have access to this action item');

  return actionItem;
};

/**
 * @route   POST /api/action-items/:summaryId
 * @desc    Manually add an action item to a summary
 * @access  Private
 */
export const createActionItem = asyncHandler(async (req: Request, res: Response) => {
  const { summaryId } = req.params;
  const { task, assignee, deadline, priority } = req.body;

  const summary = await Summary.findById(summaryId);
  if (!summary) throw ApiError.notFound('Summary not found');

  // Verify ownership through the chain
  const transcript = await Transcript.findById(summary.transcript);
  const recording = transcript && (await Recording.findById(transcript.recording));
  const meeting =
    recording && (await Meeting.findOne({ _id: recording.meeting, user: req.userId }));
  if (!meeting) throw ApiError.forbidden('You do not have access to this summary');

  const actionItem = await ActionItem.create({
    summary: summary._id,
    task,
    assignee: assignee || '',
    deadline: deadline ? new Date(deadline) : undefined,
    priority: priority || 'medium',
    status: 'pending',
  });

  sendResponse(res, 201, 'Action item created successfully', { actionItem });
});

/**
 * @route   PUT /api/action-items/:id
 * @desc    Update an action item (task, status, deadline, assignee, priority)
 * @access  Private
 */
export const updateActionItem = asyncHandler(async (req: Request, res: Response) => {
  const actionItem = await assertOwnership(req.params.id, req.userId!);

  const { task, status, deadline, assignee, priority } = req.body;

  if (task !== undefined) actionItem.task = task;
  if (status !== undefined) actionItem.status = status;
  if (deadline !== undefined) actionItem.deadline = deadline ? new Date(deadline) : undefined;
  if (assignee !== undefined) actionItem.assignee = assignee;
  if (priority !== undefined) actionItem.priority = priority;

  await actionItem.save();

  sendResponse(res, 200, 'Action item updated successfully', { actionItem });
});

/**
 * @route   DELETE /api/action-items/:id
 * @desc    Delete an action item
 * @access  Private
 */
export const deleteActionItem = asyncHandler(async (req: Request, res: Response) => {
  const actionItem = await assertOwnership(req.params.id, req.userId!);
  await actionItem.deleteOne();
  sendResponse(res, 200, 'Action item deleted successfully');
});
