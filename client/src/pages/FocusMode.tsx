import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { focusAPI, taskAPI } from '../services/api';
import { sendBrowserNotification } from '../services/browserNotification';
import { notificationSoundService } from '../services/notificationSoundService';
import { useAuthStore } from '../stores/authStore';
import { useFocusStore, FocusModeType } from '../stores/focusStore';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  Flame,
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import clsx from 'clsx';

export default function FocusMode() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const {
    mode,
    status,
    remainingSeconds,
    totalDurationSeconds,
    selectedTaskId,
    soundEnabled,
    toggleTimer,
    resetTimer,
    skipSession,
    setMode,
    setSelectedTaskId,
    toggleSound,
    reconcileTimestamps,
  } = useFocusStore();

  const isRunning = status === 'running';

  // Ensure timestamps are reconciled immediately on page mount
  useEffect(() => {
    reconcileTimestamps();
  }, [reconcileTimestamps]);

  // Queries
  const { data: sessionData } = useQuery({
    queryKey: ['focus_sessions'],
    queryFn: () => focusAPI.getFocusSessions(),
  });

  const { data: taskData } = useQuery({
    queryKey: ['tasks', 'focus_select'],
    queryFn: () => taskAPI.getTasks({ status: 'todo' }),
  });

  const sessions = sessionData?.sessions || [];
  const tasks = taskData?.tasks || [];

  const logSessionMutation = useMutation({
    mutationFn: (data: { duration: number; type: string; taskId?: string }) =>
      focusAPI.logFocusSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus_sessions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  // Calculate totals
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaySessions = sessions.filter(
    (s) => new Date(s.completedAt) >= todayStart && s.type === 'pomodoro'
  );
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);

  const handleManualSkip = async () => {
    const store = useFocusStore.getState();
    if (store.soundEnabled) {
      notificationSoundService.playPomodoroSound(user?.notificationSettings);
    }

    if (store.mode === 'pomodoro') {
      sendBrowserNotification('Pomodoro Completed! 🎉', {
        body: 'Great focus! Time for a well-deserved break.',
      });

      try {
        await logSessionMutation.mutateAsync({
          duration: store.durationMinutes,
          type: 'pomodoro',
          taskId: store.selectedTaskId || undefined,
        });
      } catch (err) {
        console.error('Failed to log skipped session:', err);
      }
    } else {
      sendBrowserNotification('Break is Over! ⚡', {
        body: 'Ready to dive back into your next productive focus session?',
      });
    }

    skipSession();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent =
    totalDurationSeconds > 0
      ? ((totalDurationSeconds - remainingSeconds) / totalDurationSeconds) * 100
      : 0;

  return (
    <div className="space-y-8 max-w-2xl mx-auto text-center py-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/10 text-violet-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Pomodoro Timer</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Focus Mode</h1>
        <p className="text-xs text-slate-400 mt-1">
          Work in distraction-free intervals to boost productivity.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center justify-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-2xl max-w-sm mx-auto">
        {(['pomodoro', 'short_break', 'long_break'] as const).map((m: FocusModeType) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={clsx(
              'flex-1 py-2 text-xs font-semibold rounded-xl capitalize transition-all',
              mode === m
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            {m === 'pomodoro' ? 'Focus' : m.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Circular Timer Visual */}
      <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
        {/* Background SVG Circle */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="110"
            className="stroke-slate-850"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="128"
            cy="128"
            r="110"
            className="stroke-violet-500 transition-all duration-300"
            strokeWidth="10"
            strokeDasharray={2 * Math.PI * 110}
            strokeDashoffset={2 * Math.PI * 110 * (1 - Math.min(100, Math.max(0, progressPercent)) / 100)}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center Timer Text */}
        <div className="absolute flex flex-col items-center">
          <span className="text-5xl font-extrabold tracking-tight text-slate-100 font-mono">
            {formatTime(remainingSeconds)}
          </span>
          <span
            className={clsx(
              'text-xs font-medium mt-1 capitalize tracking-wide',
              status === 'running'
                ? 'text-emerald-400'
                : status === 'paused'
                ? 'text-amber-400'
                : 'text-slate-400'
            )}
          >
            {status === 'running'
              ? 'In Progress'
              : status === 'paused'
              ? 'Paused'
              : 'Ready'}
          </span>
        </div>
      </div>

      {/* Task Selection for Focus */}
      <div className="max-w-sm mx-auto">
        <label className="block text-xs font-medium text-slate-400 mb-1.5 text-left">
          Focusing on task (optional):
        </label>
        <select
          value={selectedTaskId || ''}
          onChange={(e) => setSelectedTaskId(e.target.value || null)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          <option value="">General Focus (No task selected)</option>
          {tasks.map((t) => (
            <option key={t._id} value={t._id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={resetTimer}
          className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Reset timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={toggleTimer}
          className={clsx(
            'flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-white shadow-xl transition-all scale-100 active:scale-95',
            isRunning
              ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/30'
              : 'bg-violet-600 hover:bg-violet-500 shadow-violet-900/30'
          )}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-white" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-white" />
              <span>Start</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleManualSkip}
          className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Skip to next"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={toggleSound}
          className={clsx(
            'p-3 rounded-2xl transition-colors',
            soundEnabled
              ? 'bg-slate-800/80 text-violet-400'
              : 'bg-slate-800/80 text-slate-500 hover:text-slate-300'
          )}
          title={soundEnabled ? 'Mute alert' : 'Enable alert sound'}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Focus KPI Stats */}
      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-6 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-[11px] mb-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            <span>Today Sessions</span>
          </div>
          <p className="text-xl font-bold text-slate-100">{todaySessions.length}</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-[11px] mb-0.5">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            <span>Minutes Today</span>
          </div>
          <p className="text-xl font-bold text-slate-100">{todayMinutes}m</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-[11px] mb-0.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Total Logged</span>
          </div>
          <p className="text-xl font-bold text-slate-100">{sessions.length}</p>
        </div>
      </div>
    </div>
  );
}
