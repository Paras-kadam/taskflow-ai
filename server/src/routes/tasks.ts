import { Router } from 'express';
import { body } from 'express-validator';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  toggleSubtask,
  duplicateTask,
  archiveTask,
  updateDependencies,
  snoozeTask,
} from '../controllers/taskController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(protect);

router.get('/', getTasks);
router.get('/:id', getTaskById);

router.post(
  '/',
  [body('title').trim().isLength({ min: 1, max: 300 }).withMessage('Task title is required')],
  validate,
  createTask
);

router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

router.post('/:id/duplicate', duplicateTask);
router.patch('/:id/archive', archiveTask);
router.patch('/:id/dependencies', updateDependencies);
router.post('/:id/snooze', snoozeTask);

router.post('/reorder', reorderTasks);
router.patch('/:taskId/subtasks/:subtaskId/toggle', toggleSubtask);

export default router;
