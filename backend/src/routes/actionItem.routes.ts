import { Router } from 'express';
import { param, body } from 'express-validator';
import {
  createActionItem,
  updateActionItem,
  deleteActionItem,
} from '../controllers/actionItem.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

router.use(protect);

router.post(
  '/:summaryId',
  param('summaryId').isMongoId(),
  body('task').notEmpty().withMessage('Task description is required'),
  validateRequest,
  createActionItem
);
router.put('/:id', param('id').isMongoId(), validateRequest, updateActionItem);
router.delete('/:id', param('id').isMongoId(), validateRequest, deleteActionItem);

export default router;
