export interface UserNotificationSettings {
  taskReminders?: boolean;
  dueDateNotifications?: boolean;
  overdueNotifications?: boolean;
  recurringTaskNotifications?: boolean;
  dailySummary?: boolean;
  weeklyReport?: boolean;
  defaultReminder?: string;
  dailySummaryTime?: string;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  notificationSoundEnabled?: boolean;
  notificationVolume?: number;
  alarmMode?: boolean;
  completionSoundEnabled?: boolean;
  selectedReminderSound?: string;
  selectedDeadlineSound?: string;
  selectedOverdueSound?: string;
  selectedDailySummarySound?: string;
  selectedPomodoroSound?: string;
  selectedCompletionSound?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  timezone?: string;
  theme?: 'dark' | 'light' | 'system';
  notificationSettings?: UserNotificationSettings;
  createdAt: string;
}

export type TaskStatus = 'inbox' | 'todo' | 'in-progress' | 'completed' | 'archived';
export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export interface Subtask {
  _id?: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface RecurrencePattern {
  type: 'none' | 'daily' | 'weekdays' | 'weekly' | 'custom_days' | 'monthly' | 'yearly';
  interval?: number;
  daysOfWeek?: number[];
  endDate?: string;
}

export interface ProjectSummary {
  _id: string;
  name: string;
  color?: string;
  icon?: string;
}

export interface Task {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  dueTime?: string;
  reminder?: string;
  reminderAt?: string;
  reminderSent?: boolean;
  projectId?: ProjectSummary | string | null;
  tags: string[];
  subtasks: Subtask[];
  recurrence?: RecurrencePattern;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  order: number;
  notes?: string;
  isOverdue?: boolean;
  dependencies?: ({ _id: string; title: string; status: TaskStatus; priority: TaskPriority } | string)[];
  isBlocked?: boolean;
}

export interface Project {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  status: 'active' | 'completed' | 'archived';
  totalTasks?: number;
  completedTasks?: number;
  remainingTasks?: number;
  progress?: number;
  priorityDistribution?: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
    none: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  _id: string;
  userId: string;
  name: string;
  color: string;
  taskCount?: number;
}

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  taskId?: string;
  createdAt: string;
}

export interface FocusSession {
  _id: string;
  userId: string;
  taskId?: string;
  duration: number;
  type: 'pomodoro' | 'short-break' | 'long-break';
  completedAt: string;
}
