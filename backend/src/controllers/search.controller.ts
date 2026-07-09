import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Meeting from '../models/Meeting.model';
import Recording from '../models/Recording.model';
import Transcript from '../models/Transcript.model';
import Summary from '../models/Summary.model';
import Notes from '../models/Notes.model';
import { ApiError } from '../utils/ApiError';
import { sendResponse } from '../utils/apiResponse';

/**
 * @route   GET /api/search
 * @desc    Search across meeting titles, transcripts, summaries, and notes
 * @access  Private
 * @query   q (search term), from, to (date range), status
 */
export const search = asyncHandler(async (req: Request, res: Response) => {
  const { q, from, to, status } = req.query as Record<string, string>;

  if (!q || q.trim().length === 0) {
    throw ApiError.badRequest('A search query (q) is required');
  }

  const meetingQuery: Record<string, unknown> = { user: req.userId, isDeleted: false };
  if (status) meetingQuery.status = status;
  if (from || to) {
    meetingQuery.date = {
      ...(from && { $gte: new Date(from) }),
      ...(to && { $lte: new Date(to) }),
    };
  }

  // Meetings matching by title/tags/keywords
  const meetingsByTitle = await Meeting.find({
    ...meetingQuery,
    $text: { $search: q },
  }).limit(20);

  // All meeting ids owned by the user (for scoping transcript/summary/notes search)
  const allUserMeetings = await Meeting.find(meetingQuery).select('_id');
  const meetingIds = allUserMeetings.map((m) => m._id);

  const recordings = await Recording.find({ meeting: { $in: meetingIds } }).select('_id meeting');
  const recordingIds = recordings.map((r) => r._id);
  const recordingToMeeting = new Map(recordings.map((r) => [String(r._id), r.meeting]));

  const transcripts = await Transcript.find({
    recording: { $in: recordingIds },
    $text: { $search: q },
  }).limit(20);

  const transcriptMeetingIds = transcripts
    .map((t) => recordingToMeeting.get(String(t.recording)))
    .filter(Boolean);

  const transcriptIds = await Transcript.find({ recording: { $in: recordingIds } }).select('_id recording');
  const transcriptToRecording = new Map(transcriptIds.map((t) => [String(t._id), t.recording]));

  const summaries = await Summary.find({
    transcript: { $in: transcriptIds.map((t) => t._id) },
    $or: [
      { summaryText: { $regex: q, $options: 'i' } },
      { smartTitle: { $regex: q, $options: 'i' } },
      { keywords: { $regex: q, $options: 'i' } },
      { tags: { $regex: q, $options: 'i' } },
    ],
  }).limit(20);

  const notes = await Notes.find({
    meeting: { $in: meetingIds },
    $text: { $search: q },
  }).limit(20);

  // Combine all matched meeting ids into a deduped result set
  const matchedMeetingIdSet = new Set<string>([
    ...meetingsByTitle.map((m) => String(m._id)),
    ...transcriptMeetingIds.map((id) => String(id)),
    ...notes.map((n) => String(n.meeting)),
  ]);

  for (const summary of summaries) {
    const transcript = transcriptIds.find((t) => String(t._id) === String(summary.transcript));
    if (transcript) {
      const meetingId = recordingToMeeting.get(String(transcript.recording));
      if (meetingId) matchedMeetingIdSet.add(String(meetingId));
    }
  }

  const matchedMeetings = await Meeting.find({
    _id: { $in: Array.from(matchedMeetingIdSet) },
  }).sort({ createdAt: -1 });

  sendResponse(res, 200, 'Search completed successfully', {
    query: q,
    results: matchedMeetings,
    count: matchedMeetings.length,
  });
});
