import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  subscribePush,
  unsubscribePush,
} from '../controllers/notificationController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.post('/mark-all-read', markAllAsRead);
router.delete('/:id', deleteNotification);
router.delete('/', clearAllNotifications);

router.post('/subscribe', subscribePush);
router.delete('/unsubscribe', unsubscribePush);

export default router;
