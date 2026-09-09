import { Router } from 'express';
import { body } from 'express-validator';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(protect);

router.get('/', getProjects);
router.get('/:id', getProjectById);

router.post(
  '/',
  [body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Project name is required')],
  validate,
  createProject
);

router.put(
  '/:id',
  [body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Project name must be valid')],
  validate,
  updateProject
);

router.delete('/:id', deleteProject);

export default router;
