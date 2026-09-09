import { Router } from 'express';
import { body } from 'express-validator';
import { getTags, createTag, deleteTag } from '../controllers/tagController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(protect);

router.get('/', getTags);
router.post(
  '/',
  [body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Tag name is required')],
  validate,
  createTag
);
router.delete('/:id', deleteTag);

export default router;
