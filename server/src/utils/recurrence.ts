import { IRecurrence } from '../models/Task';

export function calculateNextDueDate(currentDueDate: Date, recurrence: IRecurrence): Date | null {
  if (!recurrence || recurrence.type === 'none') {
    return null;
  }

  const nextDate = new Date(currentDueDate);
  const interval = recurrence.interval || 1;

  switch (recurrence.type) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval);
      break;

    case 'weekdays': {
      // Monday = 1, Friday = 5
      do {
        nextDate.setDate(nextDate.getDate() + 1);
      } while (nextDate.getDay() === 0 || nextDate.getDay() === 6); // Skip Sun (0) and Sat (6)
      break;
    }

    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7 * interval);
      break;

    case 'custom_days': {
      // e.g. [1, 3, 5] for Mon, Wed, Fri
      if (!recurrence.daysOfWeek || recurrence.daysOfWeek.length === 0) {
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      }

      const days = [...recurrence.daysOfWeek].sort((a, b) => a - b);
      const currentDay = nextDate.getDay();
      
      // Find next day in the list that is strictly after currentDay in the same week
      const nextDayThisWeek = days.find((d) => d > currentDay);
      if (nextDayThisWeek !== undefined) {
        nextDate.setDate(nextDate.getDate() + (nextDayThisWeek - currentDay));
      } else {
        // Wrap around to the first day in next week
        const firstDayNextWeek = days[0];
        const daysUntilSunday = 7 - currentDay;
        nextDate.setDate(nextDate.getDate() + daysUntilSunday + firstDayNextWeek);
      }
      break;
    }

    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;

    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + interval);
      break;

    default:
      return null;
  }

  // Check end date constraint
  if (recurrence.endDate && nextDate > new Date(recurrence.endDate)) {
    return null;
  }

  return nextDate;
}

export function calculateReminderAt(dueDate: Date, dueTime?: string, reminder?: string): Date | null {
  if (!dueDate || !reminder || reminder === 'none') {
    return null;
  }

  const reminderDate = new Date(dueDate);
  if (dueTime) {
    const [hours, minutes] = dueTime.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      reminderDate.setHours(hours, minutes, 0, 0);
    }
  } else {
    // Default to 9:00 AM on due date
    reminderDate.setHours(9, 0, 0, 0);
  }

  switch (reminder) {
    case 'at_time':
      return reminderDate;
    case '5min':
      return new Date(reminderDate.getTime() - 5 * 60 * 1000);
    case '10min':
      return new Date(reminderDate.getTime() - 10 * 60 * 1000);
    case '15min':
      return new Date(reminderDate.getTime() - 15 * 60 * 1000);
    case '30min':
      return new Date(reminderDate.getTime() - 30 * 60 * 1000);
    case '1hour':
      return new Date(reminderDate.getTime() - 60 * 60 * 1000);
    case '1day':
      return new Date(reminderDate.getTime() - 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}
