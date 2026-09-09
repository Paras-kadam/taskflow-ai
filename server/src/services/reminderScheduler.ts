import { Task } from '../models/Task';
import { Notification } from '../models/Notification';
import { User } from '../models/User';

export function isQuietHours(now: Date, quietStart = '22:00', quietEnd = '07:00'): boolean {
  const [startH, startM] = quietStart.split(':').map(Number);
  const [endH, endM] = quietEnd.split(':').map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes > endMinutes) {
    // Overnight quiet hours, e.g. 22:00 to 07:00
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

export function startReminderScheduler(): void {
  const checkInterval = 60 * 1000; // Check every 60 seconds

  setInterval(async () => {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // 1. Check Task Reminders with atomic claim
      const tasksToRemind = await Task.find({
        reminderAt: { $lte: now },
        reminderSent: { $ne: true },
        status: { $nin: ['completed', 'archived'] },
      }).populate('userId');

      for (const task of tasksToRemind) {
        const user = task.userId as any;
        if (!user) continue;

        // Check user preferences
        const settings = user.notificationSettings || {};
        if (settings.taskReminders === false) continue;

        // If in quiet hours, defer reminder until quiet hours end
        if (isQuietHours(now, settings.quietHoursStart, settings.quietHoursEnd)) {
          continue;
        }

        // Atomic check-and-set claim to eliminate race conditions
        const claimed = await Task.findOneAndUpdate(
          { _id: task._id, reminderSent: { $ne: true } },
          { $set: { reminderSent: true } },
          { new: true }
        );
        if (!claimed) continue;

        // Check if an unread notification already exists
        const existing = await Notification.findOne({
          userId: user._id,
          taskId: task._id,
          type: 'task_reminder',
          read: false,
        });

        if (!existing) {
          await Notification.create({
            userId: user._id,
            taskId: task._id,
            type: 'task_reminder',
            title: `Reminder: ${task.title}`,
            message: task.dueTime ? `Task is due at ${task.dueTime}` : `Task is due soon`,
          });
        }
      }

      // 2. Check Overdue Tasks
      const overdueTasks = await Task.find({
        dueDate: { $lt: startOfToday },
        status: { $nin: ['completed', 'archived'] },
      }).limit(25).populate('userId');

      for (const task of overdueTasks) {
        const user = task.userId as any;
        if (!user) continue;

        const settings = user.notificationSettings || {};
        if (settings.overdueNotifications === false) continue;

        if (isQuietHours(now, settings.quietHoursStart, settings.quietHoursEnd)) {
          continue;
        }

        // Prevent duplicate overdue notification created today
        const existingOverdue = await Notification.findOne({
          userId: user._id,
          taskId: task._id,
          type: 'task_overdue',
          createdAt: { $gte: startOfToday },
        });

        if (!existingOverdue) {
          await Notification.create({
            userId: user._id,
            taskId: task._id,
            type: 'task_overdue',
            title: `Overdue: ${task.title}`,
            message: `This task was due before today and is still pending.`,
          });
        }
      }
    } catch (error) {
      console.error('Error running reminder scheduler:', error);
    }
  }, checkInterval);

  console.log('Task reminder, overdue & quiet hours background scheduler active.');
}
