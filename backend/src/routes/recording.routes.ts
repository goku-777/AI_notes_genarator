import { Router } from 'express';
import {
  uploadRecording,
  saveLiveRecording,
  getRecording,
  deleteRecording,
} from '../controllers/recording.controller';
import { protect } from '../middleware/auth.middleware';
import { uploadAudio } from '../middleware/upload.middleware';
import { param } from 'express-validator';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

router.use(protect);

const meetingIdValidator = [param('meetingId').isMongoId().withMessage('Invalid meeting id')];

router.post(
  '/:meetingId/upload',
  meetingIdValidator,
  validateRequest,
  uploadAudio.single('audio'),
  uploadRecording
);
router.post(
  '/:meetingId/live',
  meetingIdValidator,
  validateRequest,
  uploadAudio.single('audio'),
  saveLiveRecording
);
router.get('/:meetingId', meetingIdValidator, validateRequest, getRecording);
router.delete('/:meetingId', meetingIdValidator, validateRequest, deleteRecording);

export default router;
