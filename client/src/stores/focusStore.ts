import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FocusModeType = 'pomodoro' | 'short_break' | 'long_break';
export type FocusStatus = 'idle' | 'running' | 'paused';

export const FOCUS_DURATIONS: Record<FocusModeType, number> = {
  pomodoro: 25,
  short_break: 5,
  long_break: 15,
};

export interface FocusTimerState {
  mode: FocusModeType;
  status: FocusStatus;
  durationMinutes: number;
  totalDurationSeconds: number;
  remainingSeconds: number;
  startTime: number | null; // epoch ms
  endTime: number | null;   // epoch ms
  pausedAt: number | null;  // epoch ms
  selectedTaskId: string | null;
  soundEnabled: boolean;

  // Actions
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  setMode: (mode: FocusModeType) => void;
  setSelectedTaskId: (taskId: string | null) => void;
  toggleSound: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  tick: () => { isCompleted: boolean; completedSession?: { duration: number; type: FocusModeType; taskId?: string } };
  skipSession: () => void;
  reconcileTimestamps: () => void;
}

// BroadcastChannel for cross-tab synchronization
const CHANNEL_NAME = 'taskflow-focus-sync';
let syncChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    syncChannel = null;
  }
}

const broadcastSync = (type: string, payload?: any) => {
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type, payload, timestamp: Date.now() });
    } catch {
      // Ignore broadcast errors
    }
  }
};

export const useFocusStore = create<FocusTimerState>()(
  persist(
    (set, get) => ({
      mode: 'pomodoro',
      status: 'idle',
      durationMinutes: FOCUS_DURATIONS.pomodoro,
      totalDurationSeconds: FOCUS_DURATIONS.pomodoro * 60,
      remainingSeconds: FOCUS_DURATIONS.pomodoro * 60,
      startTime: null,
      endTime: null,
      pausedAt: null,
      selectedTaskId: null,
      soundEnabled: true,

      startTimer: () => {
        const { remainingSeconds, status, totalDurationSeconds } = get();
        const now = Date.now();
        const secondsToRun = (status === 'paused' || (remainingSeconds > 0 && remainingSeconds < totalDurationSeconds))
          ? remainingSeconds
          : totalDurationSeconds;

        const endTime = now + secondsToRun * 1000;

        set({
          status: 'running',
          startTime: get().startTime || now,
          endTime,
          pausedAt: null,
          remainingSeconds: secondsToRun,
        });

        broadcastSync('START', { endTime, remainingSeconds: secondsToRun });
      },

      pauseTimer: () => {
        const { status, endTime } = get();
        if (status !== 'running') return;

        const now = Date.now();
        const remainingSeconds = endTime
          ? Math.max(0, Math.round((endTime - now) / 1000))
          : get().remainingSeconds;

        set({
          status: 'paused',
          pausedAt: now,
          endTime: null,
          remainingSeconds,
        });

        broadcastSync('PAUSE', { remainingSeconds });
      },

      resumeTimer: () => {
        const { status, remainingSeconds } = get();
        if (status !== 'paused') return;

        const now = Date.now();
        const endTime = now + remainingSeconds * 1000;

        set({
          status: 'running',
          endTime,
          pausedAt: null,
        });

        broadcastSync('RESUME', { endTime, remainingSeconds });
      },

      toggleTimer: () => {
        const { status } = get();
        if (status === 'running') {
          get().pauseTimer();
        } else if (status === 'paused') {
          get().resumeTimer();
        } else {
          get().startTimer();
        }
      },

      resetTimer: () => {
        const { mode } = get();
        const durationMinutes = FOCUS_DURATIONS[mode];
        const totalDurationSeconds = durationMinutes * 60;

        set({
          status: 'idle',
          durationMinutes,
          totalDurationSeconds,
          remainingSeconds: totalDurationSeconds,
          startTime: null,
          endTime: null,
          pausedAt: null,
        });

        broadcastSync('RESET', { mode });
      },

      setMode: (mode: FocusModeType) => {
        const durationMinutes = FOCUS_DURATIONS[mode];
        const totalDurationSeconds = durationMinutes * 60;

        set({
          mode,
          status: 'idle',
          durationMinutes,
          totalDurationSeconds,
          remainingSeconds: totalDurationSeconds,
          startTime: null,
          endTime: null,
          pausedAt: null,
        });

        broadcastSync('SET_MODE', { mode });
      },

      setSelectedTaskId: (selectedTaskId: string | null) => {
        set({ selectedTaskId });
        broadcastSync('SET_TASK', { selectedTaskId });
      },

      toggleSound: () => {
        set((state) => ({ soundEnabled: !state.soundEnabled }));
      },

      setSoundEnabled: (soundEnabled: boolean) => {
        set({ soundEnabled });
      },

      reconcileTimestamps: () => {
        const { status, endTime } = get();
        if (status === 'running' && endTime) {
          const now = Date.now();
          const remaining = Math.max(0, Math.round((endTime - now) / 1000));
          set({ remainingSeconds: remaining });
        }
      },

      tick: () => {
        const { status, endTime, mode, selectedTaskId, durationMinutes } = get();

        if (status !== 'running' || !endTime) {
          return { isCompleted: false };
        }

        const now = Date.now();
        const remaining = Math.max(0, Math.round((endTime - now) / 1000));

        if (remaining <= 0) {
          // Timer finished!
          const completedSession = {
            duration: durationMinutes,
            type: mode,
            taskId: selectedTaskId || undefined,
          };

          // Auto-advance mode
          const nextMode: FocusModeType = mode === 'pomodoro' ? 'short_break' : 'pomodoro';
          const nextDurationMinutes = FOCUS_DURATIONS[nextMode];
          const nextTotalDuration = nextDurationMinutes * 60;

          set({
            mode: nextMode,
            status: 'idle',
            durationMinutes: nextDurationMinutes,
            totalDurationSeconds: nextTotalDuration,
            remainingSeconds: nextTotalDuration,
            startTime: null,
            endTime: null,
            pausedAt: null,
          });

          broadcastSync('COMPLETED', { completedSession, nextMode });

          return { isCompleted: true, completedSession };
        }

        set({ remainingSeconds: remaining });
        return { isCompleted: false };
      },

      skipSession: () => {
        const { mode } = get();
        const nextMode: FocusModeType = mode === 'pomodoro' ? 'short_break' : 'pomodoro';
        get().setMode(nextMode);
      },
    }),
    {
      name: 'taskflow-focus-timer',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // On rehydrate: reconcile remaining time from absolute timestamps
        if (state.status === 'running' && state.endTime) {
          const now = Date.now();
          const remaining = Math.max(0, Math.round((state.endTime - now) / 1000));
          if (remaining <= 0) {
            // Expired while away
            const nextMode: FocusModeType = state.mode === 'pomodoro' ? 'short_break' : 'pomodoro';
            const nextDurationMinutes = FOCUS_DURATIONS[nextMode];
            state.mode = nextMode;
            state.status = 'idle';
            state.durationMinutes = nextDurationMinutes;
            state.totalDurationSeconds = nextDurationMinutes * 60;
            state.remainingSeconds = nextDurationMinutes * 60;
            state.startTime = null;
            state.endTime = null;
            state.pausedAt = null;
          } else {
            state.remainingSeconds = remaining;
          }
        }
      },
    }
  )
);

// Listen to multi-tab events
if (typeof window !== 'undefined' && syncChannel) {
  syncChannel.onmessage = (event) => {
    const { type, payload } = event.data || {};
    const store = useFocusStore.getState();

    switch (type) {
      case 'START':
        if (payload?.endTime) {
          useFocusStore.setState({
            status: 'running',
            endTime: payload.endTime,
            remainingSeconds: payload.remainingSeconds,
            pausedAt: null,
          });
        }
        break;
      case 'PAUSE':
        useFocusStore.setState({
          status: 'paused',
          endTime: null,
          pausedAt: Date.now(),
          remainingSeconds: payload?.remainingSeconds ?? store.remainingSeconds,
        });
        break;
      case 'RESUME':
        if (payload?.endTime) {
          useFocusStore.setState({
            status: 'running',
            endTime: payload.endTime,
            remainingSeconds: payload.remainingSeconds,
            pausedAt: null,
          });
        }
        break;
      case 'RESET':
        store.resetTimer();
        break;
      case 'SET_MODE':
        if (payload?.mode) {
          store.setMode(payload.mode);
        }
        break;
      case 'SET_TASK':
        useFocusStore.setState({ selectedTaskId: payload?.selectedTaskId ?? null });
        break;
      case 'COMPLETED':
        if (payload?.nextMode) {
          store.setMode(payload.nextMode);
        }
        break;
    }
  };
}
