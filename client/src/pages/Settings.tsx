import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useToast } from '../components/ui/Toast';
import {
  Monitor,
  Moon,
  Sun,
  Bell,
  Clock,
  User,
  Palette,
  Save,
  Check,
  Volume2,
  VolumeX,
  Play,
  Square,
  Music,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import {
  BUILTIN_RINGTONES,
  COMPLETION_RINGTONE,
  notificationSoundService,
} from '../services/notificationSoundService';
import clsx from 'clsx';

export default function Settings() {
  const { user, updateProfile } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [isSaving, setIsSaving] = useState(false);
  const [previewingSoundId, setPreviewingSoundId] = useState<string | null>(null);

  const [notifications, setNotifications] = useState({
    taskReminders: true,
    dueDateNotifications: true,
    overdueNotifications: true,
    dailySummary: true,
    weeklyReport: false,
    recurringTaskNotifications: true,
    notificationSoundEnabled: true,
    notificationVolume: 80,
    alarmMode: false,
    completionSoundEnabled: true,
    selectedReminderSound: 'classic-bell',
    selectedDeadlineSound: 'digital-beep',
    selectedOverdueSound: 'urgent-alarm',
    selectedDailySummarySound: 'soft-chime',
    selectedPomodoroSound: 'focus-alert',
    selectedCompletionSound: 'task-complete',
  });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setTimezone(user.timezone || 'UTC');
      if (user.notificationSettings) {
        setNotifications({
          taskReminders: user.notificationSettings.taskReminders ?? true,
          dueDateNotifications: user.notificationSettings.dueDateNotifications ?? true,
          overdueNotifications: user.notificationSettings.overdueNotifications ?? true,
          dailySummary: user.notificationSettings.dailySummary ?? true,
          weeklyReport: user.notificationSettings.weeklyReport ?? false,
          recurringTaskNotifications: user.notificationSettings.recurringTaskNotifications ?? true,
          notificationSoundEnabled: user.notificationSettings.notificationSoundEnabled ?? true,
          notificationVolume: user.notificationSettings.notificationVolume ?? 80,
          alarmMode: user.notificationSettings.alarmMode ?? false,
          completionSoundEnabled: user.notificationSettings.completionSoundEnabled ?? true,
          selectedReminderSound: user.notificationSettings.selectedReminderSound || 'classic-bell',
          selectedDeadlineSound: user.notificationSettings.selectedDeadlineSound || 'digital-beep',
          selectedOverdueSound: user.notificationSettings.selectedOverdueSound || 'urgent-alarm',
          selectedDailySummarySound: user.notificationSettings.selectedDailySummarySound || 'soft-chime',
          selectedPomodoroSound: user.notificationSettings.selectedPomodoroSound || 'focus-alert',
          selectedCompletionSound: user.notificationSettings.selectedCompletionSound || 'task-complete',
        });
      }
    }
  }, [user]);

  const themeOptions = [
    { value: 'dark' as const, label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
    { value: 'light' as const, label: 'Light', icon: Sun, desc: 'Classic bright mode' },
    { value: 'system' as const, label: 'System', icon: Monitor, desc: 'Match your OS' },
  ];

  const handleThemeChange = async (newTheme: 'dark' | 'light' | 'system') => {
    setTheme(newTheme);
    try {
      await updateProfile({ theme: newTheme });
      showToast({
        type: 'success',
        title: 'Theme updated',
        message: `Switched to ${newTheme} mode`,
      });
    } catch {
      // Silently fail - theme is already applied locally
    }
  };

  const handleTogglePreview = (soundId: string) => {
    if (previewingSoundId === soundId) {
      notificationSoundService.stopSound();
      setPreviewingSoundId(null);
    } else {
      setPreviewingSoundId(soundId);
      notificationSoundService.previewSound(soundId, notifications.notificationVolume);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        name,
        timezone,
        notificationSettings: notifications,
      });
      showToast({
        type: 'success',
        title: 'Settings saved',
        message: 'Your preferences have been updated successfully.',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Save failed',
        message: 'Could not update settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-8 max-w-3xl pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your preferences and account settings.</p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors shadow-lg shadow-violet-600/20"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Appearance */}
      <section className="bg-slate-900 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Palette className="w-5 h-5 text-violet-400" />
          <h2 className="text-base font-semibold text-slate-100">Appearance</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-3 block">Theme</label>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => handleThemeChange(opt.value)}
                  className={clsx(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                    theme === opt.value
                      ? 'border-violet-500 bg-violet-600/10'
                      : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600'
                  )}
                >
                  <opt.icon className={clsx('w-6 h-6', theme === opt.value ? 'text-violet-400' : 'text-slate-400')} />
                  <span className={clsx('text-sm font-medium', theme === opt.value ? 'text-violet-300' : 'text-slate-300')}>
                    {opt.label}
                  </span>
                  <span className="text-xs text-slate-500">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-slate-900 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-5 h-5 text-violet-400" />
          <h2 className="text-base font-semibold text-slate-100">Notifications</h2>
        </div>
        <div className="space-y-3">
          {[
            {
              key: 'taskReminders' as const,
              label: 'Task reminders',
              desc: 'Get notified before tasks are due',
            },
            {
              key: 'dueDateNotifications' as const,
              label: 'Due date notifications',
              desc: 'Alert when a task reaches its due date',
            },
            {
              key: 'overdueNotifications' as const,
              label: 'Overdue notifications',
              desc: 'Alert when tasks become overdue',
            },
            {
              key: 'recurringTaskNotifications' as const,
              label: 'Recurring tasks',
              desc: 'Alert when recurring task instances are generated',
            },
            {
              key: 'dailySummary' as const,
              label: 'Daily summary',
              desc: 'Get a morning summary of your day',
            },
            {
              key: 'weeklyReport' as const,
              label: 'Weekly report',
              desc: 'Receive a weekly productivity report',
            },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between py-2 cursor-pointer hover:bg-slate-800/30 px-3 rounded-lg transition-colors">
              <div>
                <p className="text-sm font-medium text-slate-200">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={notifications[item.key]}
                onChange={(e) =>
                  setNotifications((prev) => ({
                    ...prev,
                    [item.key]: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-600 focus:ring-violet-500/40 focus:ring-offset-0"
              />
            </label>
          ))}
        </div>

        {/* Ringtone & Audio Alerts Sub-section */}
        <div className="pt-6 mt-6 border-t border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-slate-200">Ringtone & Audio Alerts</h3>
            </div>
          </div>

          {/* Master Sound Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  'p-2 rounded-lg',
                  notifications.notificationSoundEnabled ? 'bg-violet-600/20 text-violet-400' : 'bg-slate-800 text-slate-500'
                )}
              >
                {notifications.notificationSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Notification Sound</p>
                <p className="text-xs text-slate-400">Play ringtone and chimes for reminders and alerts</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setNotifications((prev) => ({
                  ...prev,
                  notificationSoundEnabled: !prev.notificationSoundEnabled,
                }))
              }
              className={clsx(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900',
                notifications.notificationSoundEnabled ? 'bg-violet-600' : 'bg-slate-700'
              )}
            >
              <span
                className={clsx(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  notifications.notificationSoundEnabled ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {/* Volume Control Slider */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-200">Notification Volume</span>
              </div>
              <span className="text-xs font-bold text-violet-400">
                {notifications.notificationVolume}%
              </span>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <VolumeX className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="range"
                min="0"
                max="100"
                value={notifications.notificationVolume}
                onChange={(e) =>
                  setNotifications((prev) => ({
                    ...prev,
                    notificationVolume: Number(e.target.value),
                  }))
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
              <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          </div>

          {/* Alarm-Style Mode */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  'p-2 rounded-lg',
                  notifications.alarmMode ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'
                )}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-200">Alarm Mode</p>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-violet-600/20 text-violet-300">
                    High Priority
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Keep alerts prominent on screen and repeat alarm until acknowledged or snoozed
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setNotifications((prev) => ({
                  ...prev,
                  alarmMode: !prev.alarmMode,
                }))
              }
              className={clsx(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900',
                notifications.alarmMode ? 'bg-amber-600' : 'bg-slate-700'
              )}
            >
              <span
                className={clsx(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  notifications.alarmMode ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {/* Task Completion Sound */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  'p-2 rounded-lg',
                  notifications.completionSoundEnabled ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-500'
                )}
              >
                <Check className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Task Completion Sound</p>
                <p className="text-xs text-slate-400">Play a subtle celebration chime when finishing tasks</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setNotifications((prev) => ({
                  ...prev,
                  completionSoundEnabled: !prev.completionSoundEnabled,
                }))
              }
              className={clsx(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900',
                notifications.completionSoundEnabled ? 'bg-green-600' : 'bg-slate-700'
              )}
            >
              <span
                className={clsx(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  notifications.completionSoundEnabled ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {/* Built-in Ringtone Selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-sm font-semibold text-slate-200 block">Default Notification Ringtone</label>
                <p className="text-xs text-slate-400">Select the ringtone to use for standard task reminders</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BUILTIN_RINGTONES.map((r) => {
                const isSelected = notifications.selectedReminderSound === r.id;
                const isPreviewing = previewingSoundId === r.id;
                return (
                  <div
                    key={r.id}
                    className={clsx(
                      'flex items-center justify-between p-3 rounded-xl border transition-all',
                      isSelected
                        ? 'border-violet-500 bg-violet-600/10 shadow-sm shadow-violet-500/10'
                        : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-600'
                    )}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 mr-2">
                      <input
                        type="radio"
                        name="default_ringtone"
                        value={r.id}
                        checked={isSelected}
                        onChange={() =>
                          setNotifications((prev) => ({
                            ...prev,
                            selectedReminderSound: r.id,
                          }))
                        }
                        className="w-4 h-4 text-violet-600 border-slate-600 bg-slate-800 focus:ring-violet-500/40 shrink-0"
                      />
                      <div className="truncate">
                        <p className={clsx('text-xs font-semibold truncate', isSelected ? 'text-violet-300' : 'text-slate-200')}>
                          {r.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{r.description}</p>
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleTogglePreview(r.id)}
                      className={clsx(
                        'px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0',
                        isPreviewing
                          ? 'bg-violet-600 text-white animate-pulse'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                      )}
                      title={isPreviewing ? 'Stop' : 'Preview'}
                    >
                      {isPreviewing ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                      <span className="hidden xs:inline">{isPreviewing ? 'Stop' : 'Preview'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event-Specific Sound Customization */}
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 space-y-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Custom Sounds by Event Type
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure distinct tones for specific alerts and milestones
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Task Reminder */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Task Reminder</label>
                <div className="flex items-center gap-2">
                  <select
                    value={notifications.selectedReminderSound}
                    onChange={(e) =>
                      setNotifications((prev) => ({
                        ...prev,
                        selectedReminderSound: e.target.value,
                      }))
                    }
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    {BUILTIN_RINGTONES.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleTogglePreview(notifications.selectedReminderSound)}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
                    title="Preview"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>

              {/* Deadline Alert */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Deadline Approaching</label>
                <div className="flex items-center gap-2">
                  <select
                    value={notifications.selectedDeadlineSound}
                    onChange={(e) =>
                      setNotifications((prev) => ({
                        ...prev,
                        selectedDeadlineSound: e.target.value,
                      }))
                    }
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    {BUILTIN_RINGTONES.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleTogglePreview(notifications.selectedDeadlineSound)}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
                    title="Preview"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>

              {/* Overdue Alert */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Overdue Task</label>
                <div className="flex items-center gap-2">
                  <select
                    value={notifications.selectedOverdueSound}
                    onChange={(e) =>
                      setNotifications((prev) => ({
                        ...prev,
                        selectedOverdueSound: e.target.value,
                      }))
                    }
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    {BUILTIN_RINGTONES.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleTogglePreview(notifications.selectedOverdueSound)}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
                    title="Preview"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>

              {/* Daily Summary */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Daily Summary</label>
                <div className="flex items-center gap-2">
                  <select
                    value={notifications.selectedDailySummarySound}
                    onChange={(e) =>
                      setNotifications((prev) => ({
                        ...prev,
                        selectedDailySummarySound: e.target.value,
                      }))
                    }
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    {BUILTIN_RINGTONES.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleTogglePreview(notifications.selectedDailySummarySound)}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
                    title="Preview"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>

              {/* Pomodoro Complete */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Pomodoro Complete</label>
                <div className="flex items-center gap-2">
                  <select
                    value={notifications.selectedPomodoroSound}
                    onChange={(e) =>
                      setNotifications((prev) => ({
                        ...prev,
                        selectedPomodoroSound: e.target.value,
                      }))
                    }
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    {BUILTIN_RINGTONES.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleTogglePreview(notifications.selectedPomodoroSound)}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
                    title="Preview"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>

              {/* Task Completion */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Task Completed</label>
                <div className="flex items-center gap-2">
                  <select
                    value={notifications.selectedCompletionSound}
                    onChange={(e) =>
                      setNotifications((prev) => ({
                        ...prev,
                        selectedCompletionSound: e.target.value,
                      }))
                    }
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value={COMPLETION_RINGTONE.id}>{COMPLETION_RINGTONE.name}</option>
                    {BUILTIN_RINGTONES.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleTogglePreview(notifications.selectedCompletionSound)}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
                    title="Preview"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Productivity */}
      <section className="bg-slate-900 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-5 h-5 text-violet-400" />
          <h2 className="text-base font-semibold text-slate-100">Productivity</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">Default task duration</label>
            <select
              defaultValue="60"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
              <option value="120">2 hours</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">Pomodoro duration</label>
            <select
              defaultValue="25"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            >
              <option value="15">15 minutes</option>
              <option value="25">25 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">Week starts on</label>
            <select
              defaultValue="1"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            >
              <option value="0">Sunday</option>
              <option value="1">Monday</option>
            </select>
          </div>
        </div>
      </section>

      {/* Account */}
      <section className="bg-slate-900 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-5 h-5 text-violet-400" />
          <h2 className="text-base font-semibold text-slate-100">Account</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            >
              <option value="UTC">UTC</option>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Bottom Save bar */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors shadow-lg shadow-violet-600/20"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          <span>{isSaving ? 'Saving Changes...' : 'Save Preferences'}</span>
        </button>
      </div>
    </form>
  );
}
