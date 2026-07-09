import { Router } from 'express';
import { param } from 'express-validator';
import { generateSummary, getSummary, updateSummary } from '../controllers/summary.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { aiLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(protect);

const meetingIdValidator = [param('meetingId').isMongoId().withMessage('Invalid meeting id')];

router.post('/:meetingId/generate', aiLimiter, meetingIdValidator, validateRequest, generateSummary);
router.get('/:meetingId', meetingIdValidator, validateRequest, getSummary);
router.put('/:meetingId', meetingIdValidator, validateRequest, updateSummary);

export default router;
