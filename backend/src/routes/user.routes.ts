import { Router } from 'express';
import {
  updateProfile,
  updatePassword,
  updateProfilePicture,
  deleteAccount,
  getUserStats,
} from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { uploadProfilePicture } from '../middleware/upload.middleware';
import { updateProfileValidator, updatePasswordValidator } from '../utils/validators/user.validator';

const router = Router();

router.use(protect);

router.put('/profile', updateProfileValidator, validateRequest, updateProfile);
router.put('/password', updatePasswordValidator, validateRequest, updatePassword);
router.put('/profile-picture', uploadProfilePicture.single('image'), updateProfilePicture);
router.delete('/account', deleteAccount);
router.get('/stats', getUserStats);

export default router;
