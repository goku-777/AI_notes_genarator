import { Router } from 'express';
import { param } from 'express-validator';
import { exportNotes } from '../controllers/export.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

router.use(protect);

router.get(
  '/:meetingId/:format',
  param('meetingId').isMongoId().withMessage('Invalid meeting id'),
  param('format').isIn(['pdf', 'docx', 'txt', 'md']).withMessage('Invalid export format'),
  validateRequest,
  exportNotes
);

export default router;
