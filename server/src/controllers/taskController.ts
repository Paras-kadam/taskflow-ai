import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Task, ITask } from '../models/Task';
import { Notification } from '../models/Notification';
import { calculateNextDueDate, calculateReminderAt } from '../utils/recurrence';

export const getTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const {
      status,
      priority,
      projectId,
      tag,
      filter,
      search,
      sortBy = 'order',
      order = 'asc',
      startDate,
      endDate,
    } = req.query;

    const query: any = { userId };
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Apply smart filters
    if (filter === 'today') {
      query.dueDate = { $gte: startOfToday, $lte: endOfToday };
      query.status = { $ne: 'completed' };
    } else if (filter === 'upcoming') {
      query.dueDate = { $gt: endOfToday };
      query.status = { $ne: 'completed' };
    } else if (filter === 'overdue') {
      query.dueDate = { $lt: startOfToday };
      query.status = { $ne: 'completed' };
    } else if (filter === 'completed') {
      query.status = 'completed';
    } else if (filter === 'inbox') {
      query.status = 'inbox';
    } else if (filter === 'high-priority') {
      query.priority = { $in: ['high', 'urgent'] };
      query.status = { $ne: 'completed' };
    }

    // Direct filters override or combine
    if (status && status !== 'all' && !filter) {
      query.status = status;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    if (projectId && projectId !== 'all') {
      query.projectId = projectId === 'null' ? null : projectId;
    }
    if (tag && tag !== 'all') {
      query.tags = tag;
    }

    // Date range for Calendar
    if (startDate && endDate) {
      query.dueDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    // Search query
    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { notes: searchRegex },
        { tags: searchRegex },
      ];
    }

    // Build sort object
    const sortObj: any = {};
    const sortDirection = order === 'desc' ? -1 : 1;
    if (sortBy === 'priority') {
      // In JS we can enrich or sort by priority weight, or default to order
      sortObj.order = sortDirection;
    } else {
      sortObj[sortBy as string] = sortDirection;
    }

    const tasks = await Task.find(query)
      .populate('projectId', 'name color icon')
      .populate('dependencies', 'title status priority')
      .sort(sortObj);

    // Check overdue and blocked flags dynamically
    const enrichedTasks = tasks.map((task) => {
      const t = task.toObject();
      let isOverdue = false;
      if (t.dueDate && t.status !== 'completed' && t.status !== 'archived') {
        const taskDue = new Date(t.dueDate);
        if (t.dueTime) {
          const [hours, minutes] = t.dueTime.split(':').map(Number);
          if (!isNaN(hours) && !isNaN(minutes)) {
            taskDue.setHours(hours, minutes, 0, 0);
          }
        } else {
          taskDue.setHours(23, 59, 59, 999);
        }
        isOverdue = taskDue < now;
      }

      // Compute isBlocked if any dependent task is not completed
      const isBlocked = Array.isArray(t.dependencies) && t.dependencies.some(
        (dep: any) => typeof dep === 'object' && dep !== null && dep.status !== 'completed'
      );

      return { ...t, isOverdue, isBlocked };
    });

    res.status(200).json({ tasks: enrichedTasks });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const task = await Task.findOne({ _id: req.params.id, userId })
      .populate('projectId', 'name color icon')
      .populate('dependencies', 'title status priority');

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const t = task.toObject();
    const isBlocked = Array.isArray(t.dependencies) && t.dependencies.some(
      (dep: any) => typeof dep === 'object' && dep !== null && dep.status !== 'completed'
    );

    res.status(200).json({ task: { ...t, isBlocked } });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const {
      title,
      description,
      status = 'inbox',
      priority = 'none',
      dueDate,
      dueTime,
      reminder = 'none',
      projectId,
      tags = [],
      subtasks = [],
      recurrence,
      estimatedDuration = 0,
      notes = '',
    } = req.body;

    // Determine highest order for user to append at the end
    const lastTask = await Task.findOne({ userId }).sort({ order: -1 }).select('order');
    const nextOrder = lastTask ? lastTask.order + 1 : 1;

    let reminderAt: Date | null = null;
    if (dueDate) {
      reminderAt = calculateReminderAt(new Date(dueDate), dueTime, reminder);
    }

    const task = await Task.create({
      userId,
      title,
      description,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      dueTime,
      reminder,
      reminderAt,
      projectId: projectId || null,
      tags: Array.isArray(tags) ? tags.map((t: string) => t.trim().replace(/^#/, '')) : [],
      subtasks,
      recurrence: recurrence || { type: 'none', interval: 1, daysOfWeek: [] },
      estimatedDuration,
      order: nextOrder,
      notes,
    });

    const populatedTask = await Task.findById(task._id).populate('projectId', 'name color icon');
    res.status(201).json({ task: populatedTask });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const existingTask = await Task.findOne({ _id: req.params.id, userId });

    if (!existingTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const updates = { ...req.body };

    // Handle status change to completed
    if (updates.status === 'completed' && existingTask.status !== 'completed') {
      updates.completedAt = new Date();

      // Check if recurring task — generate the next occurrence!
      if (
        existingTask.recurrence &&
        existingTask.recurrence.type !== 'none' &&
        existingTask.dueDate
      ) {
        const nextDueDate = calculateNextDueDate(existingTask.dueDate, existingTask.recurrence);
        if (nextDueDate) {
          const nextReminderAt = calculateReminderAt(
            nextDueDate,
            existingTask.dueTime,
            existingTask.reminder
          );

          // Reset subtasks for next occurrence
          const resetSubtasks = existingTask.subtasks.map((st) => ({
            title: st.title,
            completed: false,
          }));

          await Task.create({
            userId,
            title: existingTask.title,
            description: existingTask.description,
            status: 'todo',
            priority: existingTask.priority,
            dueDate: nextDueDate,
            dueTime: existingTask.dueTime,
            reminder: existingTask.reminder,
            reminderAt: nextReminderAt,
            projectId: existingTask.projectId,
            tags: existingTask.tags,
            subtasks: resetSubtasks,
            recurrence: existingTask.recurrence,
            estimatedDuration: existingTask.estimatedDuration,
            order: existingTask.order + 1,
            notes: existingTask.notes,
          });
        }
      }
    } else if (updates.status && updates.status !== 'completed') {
      updates.completedAt = null;
    }

    // Recompute reminderAt if due date or time or reminder updated
    const dueDate = updates.dueDate !== undefined ? updates.dueDate : existingTask.dueDate;
    const dueTime = updates.dueTime !== undefined ? updates.dueTime : existingTask.dueTime;
    const reminder = updates.reminder !== undefined ? updates.reminder : existingTask.reminder;
    if (dueDate) {
      updates.reminderAt = calculateReminderAt(new Date(dueDate), dueTime, reminder);
    } else if (updates.dueDate === null) {
      updates.reminderAt = null;
    }

    // Clean tags
    if (Array.isArray(updates.tags)) {
      updates.tags = updates.tags.map((t: string) => t.trim().replace(/^#/, ''));
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('projectId', 'name color icon');

    res.status(200).json({ task: updatedTask });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    res.status(200).json({ message: 'Task deleted successfully', deletedTask: task });
  } catch (error) {
    next(error);
  }
};

export const reorderTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { taskOrders } = req.body; // Array of { id: string, order: number, status?: string }

    if (!Array.isArray(taskOrders)) {
      res.status(400).json({ message: 'taskOrders must be an array' });
      return;
    }

    const bulkOps = taskOrders.map((item: { id: string; order: number; status?: string }) => {
      const updateFields: any = { order: item.order };
      if (item.status) {
        updateFields.status = item.status;
        if (item.status === 'completed') {
          updateFields.completedAt = new Date();
        }
      }
      return {
        updateOne: {
          filter: { _id: item.id, userId },
          update: { $set: updateFields },
        },
      };
    });

    await Task.bulkWrite(bulkOps);

    res.status(200).json({ message: 'Tasks reordered successfully' });
  } catch (error) {
    next(error);
  }
};

export const toggleSubtask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { taskId, subtaskId } = req.params;

    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const subtask = (task.subtasks as any).id(subtaskId);
    if (!subtask) {
      res.status(404).json({ message: 'Subtask not found' });
      return;
    }

    subtask.completed = !subtask.completed;
    subtask.completedAt = subtask.completed ? new Date() : undefined;

    await task.save();

    res.status(200).json({ task });
  } catch (error) {
    next(error);
  }
};

export const duplicateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { id } = req.params;

    const task = await Task.findOne({ _id: id, userId });
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const newTask = await Task.create({
      userId,
      title: `${task.title} (Copy)`,
      description: task.description,
      status: task.status === 'completed' ? 'todo' : task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      reminder: task.reminder,
      reminderAt: task.reminderAt,
      projectId: task.projectId,
      tags: [...task.tags],
      subtasks: task.subtasks.map((s) => ({ title: s.title, completed: false })),
      recurrence: task.recurrence,
      estimatedDuration: task.estimatedDuration,
      actualDuration: 0,
      notes: task.notes,
      order: task.order + 1,
    });

    const populated = await Task.findById(newTask._id)
      .populate('projectId', 'name color icon')
      .populate('dependencies', 'title status priority');

    res.status(201).json({ task: populated });
  } catch (error) {
    next(error);
  }
};

export const archiveTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { id } = req.params;

    const task = await Task.findOne({ _id: id, userId });
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    task.status = task.status === 'archived' ? 'todo' : 'archived';
    await task.save();

    res.status(200).json({ task });
  } catch (error) {
    next(error);
  }
};

export const updateDependencies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { id } = req.params;
    const { dependencies = [] } = req.body;

    const task = await Task.findOne({ _id: id, userId });
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // 1. Self dependency check
    if (dependencies.map(String).includes(id.toString())) {
      res.status(400).json({ message: 'A task cannot depend on itself' });
      return;
    }

    // 2. DFS cycle detection
    const allUserTasks = await Task.find({ userId }, '_id dependencies').lean();
    const depMap = new Map<string, string[]>();
    for (const t of allUserTasks) {
      depMap.set(t._id.toString(), (t.dependencies || []).map(String));
    }

    depMap.set(id.toString(), dependencies.map(String));

    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);

      const neighbors = depMap.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    if (hasCycle(id.toString())) {
      res.status(400).json({ message: 'Circular dependency detected: Adding this dependency would create a cycle.' });
      return;
    }

    task.dependencies = dependencies.map((depId: string) => new mongoose.Types.ObjectId(depId));
    await task.save();

    const updatedTask = await Task.findById(id)
      .populate('projectId', 'name color icon')
      .populate('dependencies', 'title status priority');

    res.status(200).json({ task: updatedTask });
  } catch (error) {
    next(error);
  }
};

export const snoozeTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { minutes = 10 } = req.body;
    const userId = req.user!._id;

    const snoozeMins = Number(minutes);
    if (isNaN(snoozeMins) || snoozeMins <= 0) {
      res.status(400).json({ message: 'Valid snooze duration in minutes is required' });
      return;
    }

    const task = await Task.findOne({ _id: id, userId });
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const newReminderAt = new Date(Date.now() + snoozeMins * 60 * 1000);
    task.reminderAt = newReminderAt;
    task.reminderSent = false;
    await task.save();

    // Mark current pending reminder notifications for this task as read
    await Notification.updateMany(
      { userId, taskId: task._id, type: 'task_reminder', read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      message: `Task snoozed for ${snoozeMins} minutes`,
      task,
    });
  } catch (error) {
    next(error);
  }
};

