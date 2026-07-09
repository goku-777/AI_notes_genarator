import { Router } from 'express';
import { search } from '../controllers/search.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);
router.get('/', search);

export default router;
