import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '../../services/api';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendBrowserNotification,
} from '../../services/browserNotification';
import {
  Bell,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Settings,
  Sparkles,
  X,
  Volume2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    getNotificationPermission()
  );

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.getNotifications(),
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => notificationAPI.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: () => notificationAPI.clearAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setBrowserPermission(res);
    if (res === 'granted') {
      sendBrowserNotification('TaskFlow AI Notifications Enabled! 🚀', {
        body: 'You will receive timely reminders and alerts directly on your device.',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_overdue':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'task_reminder':
      case 'task_due_soon':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'task_completed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-violet-400" />;
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        title="Notifications"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center animate-in zoom-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-600/30 text-violet-300">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-slate-400 hover:text-violet-300 transition-colors text-[11px] font-medium"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearAllMutation.mutate()}
                  className="text-slate-500 hover:text-red-400 p-1 rounded ml-1"
                  title="Clear all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Browser Permission Banner */}
          {browserPermission === 'default' && (
            <div className="p-3 bg-violet-950/40 border-b border-violet-800/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Volume2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <p className="text-[11px] text-violet-200 truncate">
                  Enable device reminders
                </p>
              </div>
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-2.5 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-medium transition-colors flex-shrink-0"
              >
                Enable
              </button>
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => {
                  if (!notif.read) markAsReadMutation.mutate(notif._id);
                }}
                className={clsx(
                  'p-3.5 flex items-start gap-3 transition-colors cursor-pointer group',
                  notif.read ? 'bg-slate-900/60 opacity-70' : 'bg-slate-850 hover:bg-slate-800'
                )}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-semibold text-slate-100 truncate">
                      {notif.title}
                    </h4>
                    {!notif.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotificationMutation.mutate(notif._id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition-all"
                  title="Delete"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-xs">
                You're all caught up! No notifications.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-slate-800 bg-slate-950/40 text-center">
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Settings className="w-3 h-3" />
              <span>Notification Preferences</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
