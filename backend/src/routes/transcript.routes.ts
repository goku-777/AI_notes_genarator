import { Router } from 'express';
import { param, body } from 'express-validator';
import {
  generateTranscript,
  getTranscript,
  updateTranscript,
} from '../controllers/transcript.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { aiLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(protect);

const meetingIdValidator = [param('meetingId').isMongoId().withMessage('Invalid meeting id')];

router.post(
  '/:meetingId/generate',
  aiLimiter,
  meetingIdValidator,
  validateRequest,
  generateTranscript
);
router.get('/:meetingId', meetingIdValidator, validateRequest, getTranscript);
router.put(
  '/:meetingId',
  meetingIdValidator,
  body('transcriptText').notEmpty().withMessage('Transcript text is required'),
  validateRequest,
  updateTranscript
);

export default router;
