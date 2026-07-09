import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Meeting from '../models/Meeting.model';
import Notes from '../models/Notes.model';
import { ApiError } from '../utils/ApiError';
import {
  generatePdfBuffer,
  generateDocxBuffer,
  generateTxtBuffer,
  generateMarkdownBuffer,
} from '../services/export.service';

type ExportFormat = 'pdf' | 'docx' | 'txt' | 'md';

const sanitizeFileName = (name: string): string =>
  name.replace(/[^a-z0-9\-_]+/gi, '-').replace(/-+/g, '-').toLowerCase();

/**
 * @route   GET /api/export/:meetingId/:format
 * @desc    Export a meeting's notes as pdf | docx | txt | md
 * @access  Private
 */
export const exportNotes = asyncHandler(async (req: Request, res: Response) => {
  const { meetingId, format } = req.params as { meetingId: string; format: ExportFormat };

  const meeting = await Meeting.findOne({ _id: meetingId, user: req.userId });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  const notes = await Notes.findOne({ meeting: meeting._id });
  if (!notes) throw ApiError.notFound('Notes not found for this meeting');

  const fileBaseName = sanitizeFileName(meeting.title || 'meeting-notes');

  switch (format) {
    case 'pdf': {
      const buffer = await generatePdfBuffer(meeting.title, notes.noteContent);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileBaseName}.pdf"`);
      res.send(buffer);
      return;
    }
    case 'docx': {
      const buffer = await generateDocxBuffer(meeting.title, notes.noteContent);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${fileBaseName}.docx"`);
      res.send(buffer);
      return;
    }
    case 'txt': {
      const buffer = generateTxtBuffer(meeting.title, notes.noteContent);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileBaseName}.txt"`);
      res.send(buffer);
      return;
    }
    case 'md': {
      const buffer = generateMarkdownBuffer(meeting.title, notes.noteContent);
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileBaseName}.md"`);
      res.send(buffer);
      return;
    }
    default:
      throw ApiError.badRequest('Unsupported export format. Use pdf, docx, txt, or md.');
  }
});
