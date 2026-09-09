import { Request, Response, NextFunction } from 'express';
import { FocusSession } from '../models/FocusSession';

export const logFocusSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { duration, type = 'pomodoro', taskId } = req.body;

    const session = await FocusSession.create({
      userId,
      duration: duration || 25,
      type,
      taskId: taskId || null,
      completedAt: new Date(),
    });

    res.status(201).json({ session });
  } catch (error) {
    next(error);
  }
};

export const getFocusSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const sessions = await FocusSession.find({ userId })
      .sort({ completedAt: -1 })
      .limit(30)
      .populate('taskId', 'title');

    res.status(200).json({ sessions });
  } catch (error) {
    next(error);
  }
};
