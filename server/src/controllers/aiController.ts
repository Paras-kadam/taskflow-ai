import { Request, Response, NextFunction } from 'express';
import {
  parseNaturalLanguageTask,
  breakdownTaskWithAI,
  prioritizeTasksWithAI,
  smartScheduleWithAI,
  getProductivitySuggestions,
} from '../services/aiService';
import { Task } from '../models/Task';

export const parseTaskController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { input } = req.body;
    if (!input || typeof input !== 'string') {
      res.status(400).json({ message: 'Input text is required' });
      return;
    }

    const parsed = await parseNaturalLanguageTask(input);
    res.status(200).json({ parsed });
  } catch (error) {
    next(error);
  }
};

export const breakdownTaskController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description } = req.body;
    if (!title || typeof title !== 'string') {
      res.status(400).json({ message: 'Task title is required' });
      return;
    }

    const result = await breakdownTaskWithAI(title, description);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const prioritizeTasksController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const tasks = await Task.find({ userId, status: { $ne: 'completed' } });
    const result = await prioritizeTasksWithAI(tasks);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const smartScheduleController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { workHoursPerDay = 4 } = req.body;
    const tasks = await Task.find({ userId, status: { $ne: 'completed' } });
    const result = await smartScheduleWithAI(tasks, Number(workHoursPerDay));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const productivitySuggestionsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const result = await getProductivitySuggestions(userId.toString());
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
