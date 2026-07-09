import { Router } from 'express';
import {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  restoreMeeting,
  permanentlyDeleteMeeting,
} from '../controllers/meeting.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createMeetingValidator,
  updateMeetingValidator,
  mongoIdParamValidator,
} from '../utils/validators/meeting.validator';

const router = Router();

router.use(protect);

router.post('/', createMeetingValidator, validateRequest, createMeeting);
router.get('/', getMeetings);
router.get('/:id', mongoIdParamValidator, validateRequest, getMeetingById);
router.put('/:id', updateMeetingValidator, validateRequest, updateMeeting);
router.delete('/:id', mongoIdParamValidator, validateRequest, deleteMeeting);
router.patch('/:id/restore', mongoIdParamValidator, validateRequest, restoreMeeting);
router.delete(
  '/:id/permanent',
  mongoIdParamValidator,
  validateRequest,
  permanentlyDeleteMeeting
);

export default router;
