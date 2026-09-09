import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationAPI, taskAPI } from '../../services/api';
import { notificationSoundService } from '../../services/notificationSoundService';
import { sendBrowserNotification } from '../../services/browserNotification';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { useToast } from '../ui/Toast';
import { Notification } from '../../types';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  X,
  ExternalLink,
  Moon,
} from 'lucide-react';
import clsx from 'clsx';

function checkIsQuietHours(quietStart = '22:00', quietEnd = '07:00'): boolean {
  const now = new Date();
  const [startH, startM] = quietStart.split(':').map(Number);
  const [endH, endM] = quietEnd.split(':').map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

export function AlarmNotificationManager() {
  const { user } = useAuthStore();
  const { openTaskDetail } = useUiStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [activeAlarm, setActiveAlarm] = useState<Notification | null>(null);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const alertedIdsRef = useRef<Set<string>>(new Set());
  const snoozeRef = useRef<HTMLDivElement>(null);

  // Poll notifications every 15 seconds
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.getNotifications(),
    refetchInterval: 15000,
  });

  const notifications = data?.notifications || [];
  const settings = user?.notificationSettings;
  const isAlarmMode = settings?.alarmMode ?? false;

  // Handle outside click for snooze dropdown
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (snoozeRef.current && !snoozeRef.current.contains(e.target as Node)) {
        setShowSnoozeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Check for new reminder / overdue notifications
  useEffect(() => {
    if (!notifications.length) return;

    // Find the latest unread reminder or overdue notification that hasn't been alerted
    const candidate = notifications.find(
      (n) =>
        !n.read &&
        (n.type === 'task_reminder' || n.type === 'task_overdue' || n.type === 'task_due_soon') &&
        !alertedIdsRef.current.has(n._id)
    );

    if (candidate) {
      alertedIdsRef.current.add(candidate._id);
      setActiveAlarm(candidate);

      const inQuietHours = checkIsQuietHours(settings?.quietHoursStart, settings?.quietHoursEnd);

      // Play sound only if quiet hours are not active and sound is enabled
      if (!inQuietHours && settings?.notificationSoundEnabled !== false) {
        if (candidate.type === 'task_overdue') {
          notificationSoundService.playOverdueSound(settings);
        } else if (candidate.type === 'task_due_soon') {
          notificationSoundService.playDeadlineSound(settings);
        } else {
          notificationSoundService.playReminderSound(settings);
        }
      }

      // Also trigger browser push / desktop notification
      sendBrowserNotification(candidate.title, {
        body: candidate.message,
        url: candidate.taskId ? `/inbox` : undefined,
      });
    }
  }, [notifications, settings]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleDismiss = () => {
    notificationSoundService.stopSound();
    if (activeAlarm) {
      markReadMutation.mutate(activeAlarm._id);
    }
    setActiveAlarm(null);
    setShowSnoozeMenu(false);
  };

  const handleOpenTask = () => {
    notificationSoundService.stopSound();
    if (activeAlarm?.taskId) {
      openTaskDetail(activeAlarm.taskId);
    }
    if (activeAlarm) {
      markReadMutation.mutate(activeAlarm._id);
    }
    setActiveAlarm(null);
    setShowSnoozeMenu(false);
  };

  const handleDone = async () => {
    notificationSoundService.stopSound();
    if (activeAlarm?.taskId) {
      try {
        await taskAPI.updateTask(activeAlarm.taskId, { status: 'completed' });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
        notificationSoundService.playCompletionSound(settings);
        showToast({
          type: 'success',
          title: 'Task completed! ✓',
          message: activeAlarm.title.replace(/^Reminder:\s*|^Overdue:\s*/i, ''),
        });
      } catch (err) {
        console.error('Error marking task completed:', err);
      }
    }
    if (activeAlarm) {
      markReadMutation.mutate(activeAlarm._id);
    }
    setActiveAlarm(null);
    setShowSnoozeMenu(false);
  };

  const handleSnooze = async (minutes: number) => {
    notificationSoundService.stopSound();
    setShowSnoozeMenu(false);

    if (activeAlarm?.taskId) {
      try {
        await taskAPI.snoozeTask(activeAlarm.taskId, minutes);
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        showToast({
          type: 'info',
          title: 'Reminder snoozed',
          message: `We'll remind you again in ${minutes} minutes.`,
        });
      } catch (err) {
        console.error('Error snoozing task:', err);
        showToast({
          type: 'error',
          title: 'Snooze failed',
          message: 'Could not snooze the task. Please try again.',
        });
      }
    }

    if (activeAlarm) {
      markReadMutation.mutate(activeAlarm._id);
    }
    setActiveAlarm(null);
  };

  if (!activeAlarm) return null;

  const inQuietHours = checkIsQuietHours(settings?.quietHoursStart, settings?.quietHoursEnd);
  const isOverdue = activeAlarm.type === 'task_overdue';
  const cleanTitle = activeAlarm.title.replace(/^Reminder:\s*|^Overdue:\s*/i, '');

  const snoozeOptions = [
    { label: '5 minutes', minutes: 5 },
    { label: '10 minutes', minutes: 10 },
    { label: '15 minutes', minutes: 15 },
    { label: '30 minutes', minutes: 30 },
    { label: '1 hour', minutes: 60 },
  ];

  return (
    <>
      {/* Alarm Mode Modal Backdrop */}
      {isAlarmMode && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-in fade-in"
          onClick={handleDismiss}
        />
      )}

      {/* Alarm Alert Card / Modal */}
      <div
        className={clsx(
          'z-50 transition-all duration-300 animate-in',
          isAlarmMode
            ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 bg-slate-900 border-2 border-violet-500 rounded-2xl shadow-2xl shadow-violet-500/20 ring-4 ring-violet-500/20'
            : 'fixed top-4 right-4 max-w-md w-[calc(100vw-2rem)] p-4 bg-slate-900/95 border border-slate-700 backdrop-blur rounded-2xl shadow-2xl slide-in-from-top-4'
        )}
      >
        {/* Header Badge */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div
              className={clsx(
                'p-2 rounded-xl flex items-center justify-center animate-bounce',
                isOverdue ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
              )}
            >
              {isOverdue ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <div className="flex items-center gap-0.5">
                  <Bell className="w-5 h-5 animate-[wiggle_1s_ease-in-out_infinite]" />
                  {isAlarmMode && <Bell className="w-4 h-4 opacity-80" />}
                </div>
              )}
            </div>
            <div>
              <span
                className={clsx(
                  'text-xs font-bold tracking-wider uppercase',
                  isOverdue ? 'text-red-400' : 'text-amber-400'
                )}
              >
                {isAlarmMode ? '🔔🔔🔔 ' : ''}
                {isOverdue ? 'OVERDUE TASK ALERT' : 'TASK REMINDER'}
              </span>
              {inQuietHours && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                  <Moon className="w-3 h-3 text-indigo-400" />
                  <span>Quiet Hours Active (Muted)</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task Details Content */}
        <div className="mb-5 pl-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-100 line-clamp-2">
            {cleanTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{activeAlarm.message}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          {/* Open Task */}
          {activeAlarm.taskId && (
            <button
              type="button"
              onClick={handleOpenTask}
              className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Task</span>
            </button>
          )}

          {/* Mark as Done */}
          {activeAlarm.taskId && (
            <button
              type="button"
              onClick={handleDone}
              className="flex-1 min-w-[90px] flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold text-xs rounded-xl shadow transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>DONE</span>
            </button>
          )}

          {/* Snooze Dropdown */}
          {activeAlarm.taskId && (
            <div className="relative" ref={snoozeRef}>
              <button
                type="button"
                onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium text-xs rounded-xl transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Snooze</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showSnoozeMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-36 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 animate-in zoom-in-95">
                  <div className="py-1">
                    {snoozeOptions.map((opt) => (
                      <button
                        key={opt.minutes}
                        type="button"
                        onClick={() => handleSnooze(opt.minutes)}
                        className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700/80 hover:text-amber-300 transition-colors flex items-center justify-between"
                      >
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-2 text-slate-400 hover:text-slate-200 text-xs rounded-xl hover:bg-slate-800/60 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </>
  );
}
