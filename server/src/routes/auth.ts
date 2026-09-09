import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';

const router = Router();

router.post(
  '/register',
  authLimiter,
  [
    body('name').isString().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  validate,
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post('/logout', logout);

router.get('/me', protect, getMe);

router.put(
  '/profile',
  protect,
  [
    body('name').optional().isString().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('avatar').optional().isString().withMessage('Avatar must be a string'),
    body('timezone').optional().isString().withMessage('Timezone must be a string'),
    body('theme').optional().isIn(['dark', 'light', 'system']).withMessage('Invalid theme'),
  ],
  validate,
  updateProfile
);

export default router;
