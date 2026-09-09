import { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/Notification';
import { PushSubscription } from '../models/PushSubscription';

export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    const unreadCount = await Notification.countDocuments({ userId, read: false });
    res.status(200).json({ notification, unreadCount });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });

    res.status(200).json({ message: 'All notifications marked as read', unreadCount: 0 });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId });

    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    const unreadCount = await Notification.countDocuments({ userId, read: false });
    res.status(200).json({ message: 'Notification deleted', unreadCount });
  } catch (error) {
    next(error);
  }
};

export const clearAllNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    await Notification.deleteMany({ userId });

    res.status(200).json({ message: 'All notifications cleared', unreadCount: 0 });
  } catch (error) {
    next(error);
  }
};

export const subscribePush = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      res.status(400).json({ message: 'Valid push subscription object required' });
      return;
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { userId, endpoint, keys },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Push subscription registered successfully' });
  } catch (error) {
    next(error);
  }
};

export const unsubscribePush = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { endpoint } = req.body;

    await PushSubscription.findOneAndDelete({ endpoint, userId });
    res.status(200).json({ message: 'Push subscription removed successfully' });
  } catch (error) {
    next(error);
  }
};
