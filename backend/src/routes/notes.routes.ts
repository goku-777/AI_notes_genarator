import { Router } from 'express';
import { param, body } from 'express-validator';
import {
  getNotes,
  updateNotes,
  generateShareLink,
  revokeShareLink,
  emailShareLink,
  getSharedNotes,
} from '../controllers/notes.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// Public route — must be registered before the protect() middleware applies
router.get('/shared/:shareToken', getSharedNotes);

router.use(protect);

const meetingIdValidator = [param('meetingId').isMongoId().withMessage('Invalid meeting id')];

router.get('/:meetingId', meetingIdValidator, validateRequest, getNotes);
router.put(
  '/:meetingId',
  meetingIdValidator,
  body('noteContent').exists().withMessage('noteContent is required'),
  validateRequest,
  updateNotes
);
router.post('/:meetingId/share', meetingIdValidator, validateRequest, generateShareLink);
router.delete('/:meetingId/share', meetingIdValidator, validateRequest, revokeShareLink);
router.post(
  '/:meetingId/share/email',
  meetingIdValidator,
  body('recipientEmail').isEmail().withMessage('A valid recipient email is required'),
  validateRequest,
  emailShareLink
);

export default router;
