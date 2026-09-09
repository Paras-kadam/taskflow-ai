import { Router } from 'express';
import {
  startTimeSession,
  stopTimeSession,
  getTaskTimeSessions,
  getTimeStats,
} from '../controllers/timeController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.post('/start', startTimeSession);
router.post('/stop', stopTimeSession);
router.get('/task/:taskId', getTaskTimeSessions);
router.get('/stats', getTimeStats);

export default router;
