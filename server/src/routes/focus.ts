import { Router } from 'express';
import { logFocusSession, getFocusSessions } from '../controllers/focusController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getFocusSessions);
router.post('/', logFocusSession);

export default router;
