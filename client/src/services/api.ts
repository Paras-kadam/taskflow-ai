import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { Task, Project, Tag, Notification, FocusSession } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
});

// Request interceptor: attach Bearer token fallback for cross-domain resilience
api.interceptors.request.use((config) => {
  const token =
    useAuthStore.getState().token ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('taskflow-auth-token') : null);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      // Clear auth on 401 Unauthorized
      const logout = useAuthStore.getState().logout;
      logout(true);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: any) => api.post('/api/auth/register', data).then((res) => res.data),
  login: (data: any) => api.post('/api/auth/login', data).then((res) => res.data),
  logout: () => api.post('/api/auth/logout').then((res) => res.data),
  getMe: () => api.get('/api/auth/me').then((res) => res.data),
  updateProfile: (data: any) => api.put('/api/auth/profile', data).then((res) => res.data),
};

export const taskAPI = {
  getTasks: (params?: Record<string, any>): Promise<{ tasks: Task[] }> =>
    api.get('/api/tasks', { params }).then((res) => res.data),
  getTaskById: (id: string): Promise<{ task: Task }> =>
    api.get(`/api/tasks/${id}`).then((res) => res.data),
  createTask: (data: Partial<Task>): Promise<{ task: Task }> =>
    api.post('/api/tasks', data).then((res) => res.data),
  updateTask: (id: string, data: Partial<Task>): Promise<{ task: Task }> =>
    api.put(`/api/tasks/${id}`, data).then((res) => res.data),
  deleteTask: (id: string): Promise<{ message: string; deletedTask: Task }> =>
    api.delete(`/api/tasks/${id}`).then((res) => res.data),
  reorderTasks: (taskOrders: { id: string; order: number; status?: string }[]): Promise<any> =>
    api.post('/api/tasks/reorder', { taskOrders }).then((res) => res.data),
  toggleSubtask: (taskId: string, subtaskId: string): Promise<{ task: Task }> =>
    api.patch(`/api/tasks/${taskId}/subtasks/${subtaskId}/toggle`).then((res) => res.data),
  duplicateTask: (id: string): Promise<{ task: Task }> =>
    api.post(`/api/tasks/${id}/duplicate`).then((res) => res.data),
  archiveTask: (id: string): Promise<{ task: Task }> =>
    api.patch(`/api/tasks/${id}/archive`).then((res) => res.data),
  updateDependencies: (id: string, dependencies: string[]): Promise<{ task: Task }> =>
    api.patch(`/api/tasks/${id}/dependencies`, { dependencies }).then((res) => res.data),
  snoozeTask: (id: string, minutes: number): Promise<{ task: Task; message: string }> =>
    api.post(`/api/tasks/${id}/snooze`, { minutes }).then((res) => res.data),
};

export const projectAPI = {
  getProjects: (): Promise<{ projects: Project[] }> =>
    api.get('/api/projects').then((res) => res.data),
  getProjectById: (id: string): Promise<{ project: Project; tasks: Task[] }> =>
    api.get(`/api/projects/${id}`).then((res) => res.data),
  createProject: (data: Partial<Project>): Promise<{ project: Project }> =>
    api.post('/api/projects', data).then((res) => res.data),
  updateProject: (id: string, data: Partial<Project>): Promise<{ project: Project }> =>
    api.put(`/api/projects/${id}`, data).then((res) => res.data),
  deleteProject: (id: string): Promise<{ message: string }> =>
    api.delete(`/api/projects/${id}`).then((res) => res.data),
};

export const tagAPI = {
  getTags: (): Promise<{ tags: Tag[] }> =>
    api.get('/api/tags').then((res) => res.data),
  createTag: (data: { name: string; color?: string }): Promise<{ tag: Tag }> =>
    api.post('/api/tags', data).then((res) => res.data),
  deleteTag: (id: string): Promise<{ message: string }> =>
    api.delete(`/api/tags/${id}`).then((res) => res.data),
};

export const notificationAPI = {
  getNotifications: (): Promise<{ notifications: Notification[]; unreadCount: number }> =>
    api.get('/api/notifications').then((res) => res.data),
  markAsRead: (id: string): Promise<{ notification: Notification; unreadCount: number }> =>
    api.patch(`/api/notifications/${id}/read`).then((res) => res.data),
  markAllAsRead: (): Promise<{ message: string; unreadCount: number }> =>
    api.post('/api/notifications/mark-all-read').then((res) => res.data),
  deleteNotification: (id: string): Promise<{ message: string; unreadCount: number }> =>
    api.delete(`/api/notifications/${id}`).then((res) => res.data),
  clearAllNotifications: (): Promise<{ message: string; unreadCount: number }> =>
    api.delete('/api/notifications').then((res) => res.data),
};

export const analyticsAPI = {
  getAnalytics: (): Promise<{
    overview: {
      totalTasks: number;
      totalCompleted: number;
      totalActive: number;
      completedToday: number;
      completedYesterday: number;
      dueToday: number;
      todayRemaining: number;
      overdueTasks: number;
      completionRate: number;
      currentStreak: number;
      productivityScore: number;
      totalFocusMinutes: number;
      todayFocusMinutes: number;
      focusSessionsCount: number;
    };
    priorityDistribution: Record<string, number>;
    historyData: { date: string; completed: number; created: number }[];
    projectStats: {
      name: string;
      color: string;
      total: number;
      completed: number;
      remaining: number;
      progress: number;
    }[];
  }> => api.get('/api/analytics').then((res) => res.data),
};

export const focusAPI = {
  getFocusSessions: (): Promise<{ sessions: FocusSession[] }> =>
    api.get('/api/focus').then((res) => res.data),
  logFocusSession: (data: { duration: number; type: string; taskId?: string }): Promise<{ session: FocusSession }> =>
    api.post('/api/focus', data).then((res) => res.data),
};

export const aiAPI = {
  parseTask: (input: string): Promise<{
    parsed: {
      title: string;
      dueDate?: string;
      dueTime?: string;
      priority: any;
      tags: string[];
      estimatedDuration?: number;
    };
  }> => api.post('/api/ai/parse', { input }).then((res) => res.data),
  breakdownTask: (title: string, description?: string): Promise<{
    subtasks: { title: string; estimatedDuration?: number }[];
  }> => api.post('/api/ai/breakdown', { title, description }).then((res) => res.data),
  prioritize: (): Promise<{
    rankedTasks: {
      taskId: string;
      title: string;
      score: number;
      priority: string;
      dueDate?: string;
      rationale: string;
    }[];
  }> => api.post('/api/ai/prioritize').then((res) => res.data),
  schedule: (workHoursPerDay?: number): Promise<{
    schedule: {
      date: string;
      dayLabel: string;
      allocatedMinutes: number;
      tasks: { taskId: string; title: string; priority: string; estimatedDuration: number }[];
    }[];
    recommendations: string[];
  }> => api.post('/api/ai/schedule', { workHoursPerDay }).then((res) => res.data),
  getSuggestions: (): Promise<{
    suggestions: {
      id: string;
      type: 'urgent' | 'streak' | 'dependency' | 'focus' | 'tip';
      title: string;
      message: string;
      actionLabel?: string;
      actionUrl?: string;
    }[];
  }> => api.get('/api/ai/suggestions').then((res) => res.data),
};

export const timeAPI = {
  startTimer: (taskId: string, note?: string): Promise<{ session: any }> =>
    api.post('/api/time/start', { taskId, note }).then((res) => res.data),
  stopTimer: (data: { taskId?: string; sessionId?: string; duration?: number; note?: string }): Promise<{ session: any; task: Task }> =>
    api.post('/api/time/stop', data).then((res) => res.data),
  getTaskSessions: (taskId: string): Promise<{ sessions: any[] }> =>
    api.get(`/api/time/task/${taskId}`).then((res) => res.data),
  getStats: (): Promise<{ todayMinutes: number; weekMinutes: number; totalMinutes: number; totalSessionsCount: number }> =>
    api.get('/api/time/stats').then((res) => res.data),
};

export default api;
