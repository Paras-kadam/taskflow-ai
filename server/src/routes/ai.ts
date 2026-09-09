import { Router } from 'express';
import {
  parseTaskController,
  breakdownTaskController,
  prioritizeTasksController,
  smartScheduleController,
  productivitySuggestionsController,
} from '../controllers/aiController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

// Parsing
router.post('/parse', parseTaskController);
router.post('/parse-task', parseTaskController);

// Breakdown
router.post('/breakdown', breakdownTaskController);
router.post('/breakdown-task', breakdownTaskController);

// Smart Prioritization & Scheduling
router.post('/prioritize', prioritizeTasksController);
router.post('/schedule', smartScheduleController);

// Proactive Suggestions
router.get('/suggestions', productivitySuggestionsController);

export default router;
