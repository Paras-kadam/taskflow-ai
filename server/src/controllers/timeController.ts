import { Request, Response, NextFunction } from 'express';
import { TimeSession } from '../models/TimeSession';
import { Task } from '../models/Task';

export const startTimeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { taskId, note = '' } = req.body;

    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const session = await TimeSession.create({
      userId,
      taskId,
      startTime: new Date(),
      note,
    });

    res.status(201).json({ session });
  } catch (error) {
    next(error);
  }
};

export const stopTimeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { sessionId, taskId, duration = 0, note = '' } = req.body;

    let session;
    if (sessionId) {
      session = await TimeSession.findOne({ _id: sessionId, userId });
    } else if (taskId) {
      session = await TimeSession.findOne({ taskId, userId, endTime: { $exists: false } }).sort({ createdAt: -1 });
    }

    const now = new Date();
    const finalDuration = duration > 0 ? duration : (session ? Math.round((now.getTime() - session.startTime.getTime()) / 1000) : 0);

    if (session) {
      session.endTime = now;
      session.duration = finalDuration;
      session.completedAt = now;
      if (note) session.note = note;
      await session.save();
    } else if (taskId) {
      // Create completed session directly
      session = await TimeSession.create({
        userId,
        taskId,
        startTime: new Date(now.getTime() - finalDuration * 1000),
        endTime: now,
        duration: finalDuration,
        note,
        completedAt: now,
      });
    } else {
      res.status(400).json({ message: 'Either sessionId or taskId is required' });
      return;
    }

    // Increment task's actualDuration in minutes
    const minutesAdded = Math.max(1, Math.round(finalDuration / 60));
    const targetTaskId = session.taskId || taskId;
    const task = await Task.findOneAndUpdate(
      { _id: targetTaskId, userId },
      { $inc: { actualDuration: minutesAdded } },
      { new: true }
    );

    res.status(200).json({ session, task });
  } catch (error) {
    next(error);
  }
};

export const getTaskTimeSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { taskId } = req.params;

    const sessions = await TimeSession.find({ taskId, userId }).sort({ createdAt: -1 });
    res.status(200).json({ sessions });
  } catch (error) {
    next(error);
  }
};

export const getTimeStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const [todaySessions, weekSessions, totalSessions] = await Promise.all([
      TimeSession.find({ userId, completedAt: { $gte: startOfToday } }),
      TimeSession.find({ userId, completedAt: { $gte: startOfWeek } }),
      TimeSession.find({ userId, completedAt: { $exists: true } }),
    ]);

    const todaySeconds = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const weekSeconds = weekSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const totalSeconds = totalSessions.reduce((acc, s) => acc + (s.duration || 0), 0);

    res.status(200).json({
      todayMinutes: Math.round(todaySeconds / 60),
      weekMinutes: Math.round(weekSeconds / 60),
      totalMinutes: Math.round(totalSeconds / 60),
      totalSessionsCount: totalSessions.length,
    });
  } catch (error) {
    next(error);
  }
};
