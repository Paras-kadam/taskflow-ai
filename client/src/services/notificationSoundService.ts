// TaskFlow AI — Notification Sound & Ringtone Service

export interface RingtoneOption {
  id: string;
  name: string;
  description: string;
  file: string;
}

export const BUILTIN_RINGTONES: RingtoneOption[] = [
  { id: 'classic-bell', name: 'Classic Bell', description: 'Warm dual-harmonic bell chime', file: '/sounds/classic-bell.wav' },
  { id: 'digital-beep', name: 'Digital Beep', description: 'Modern crisp electronic pulse', file: '/sounds/digital-beep.wav' },
  { id: 'soft-chime', name: 'Soft Chime', description: 'Gentle ascending three-tone chord', file: '/sounds/soft-chime.wav' },
  { id: 'morning-bell', name: 'Morning Bell', description: 'Deep resonant bell strike', file: '/sounds/morning-bell.wav' },
  { id: 'urgent-alarm', name: 'Urgent Alarm', description: 'High-urgency alternating pulse', file: '/sounds/urgent-alarm.wav' },
  { id: 'double-beep', name: 'Double Beep', description: 'Snappy double confirmation chirp', file: '/sounds/double-beep.wav' },
  { id: 'focus-alert', name: 'Focus Alert', description: 'Rhythmic focus transition chime', file: '/sounds/focus-alert.wav' },
  { id: 'gentle-reminder', name: 'Gentle Reminder', description: 'Calming ambient swell tone', file: '/sounds/gentle-reminder.wav' },
];

export const COMPLETION_RINGTONE: RingtoneOption = {
  id: 'task-complete',
  name: 'Task Complete',
  description: 'Bright uplifting major triad',
  file: '/sounds/task-complete.wav',
};

class NotificationSoundService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentPreviewAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private isUnlocked = false;
  private loopTimeout: any = null;
  private isLooping = false;
  private listeners: Array<() => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      // Auto-unlock on first user interaction anywhere
      const unlockHandler = () => {
        this.unlockAudio();
        window.removeEventListener('click', unlockHandler, true);
        window.removeEventListener('keydown', unlockHandler, true);
        window.removeEventListener('touchstart', unlockHandler, true);
      };

      window.addEventListener('click', unlockHandler, true);
      window.addEventListener('keydown', unlockHandler, true);
      window.addEventListener('touchstart', unlockHandler, true);
    }
  }

  public getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    return this.audioContext;
  }

  public async unlockAudio(): Promise<boolean> {
    try {
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }
      this.isUnlocked = true;
      this.notifyListeners();
      return true;
    } catch (e) {
      console.warn('Could not unlock AudioContext:', e);
      return false;
    }
  }

  public isAudioUnlocked(): boolean {
    if (typeof window === 'undefined') return false;
    const ctx = this.getAudioContext();
    return this.isUnlocked || (ctx !== null && ctx.state === 'running');
  }

  public onUnlockChange(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    for (const l of this.listeners) {
      try {
        l();
      } catch (err) {
        console.error('Error in sound listener:', err);
      }
    }
  }

  // Synthesizer fallback in case static assets fail to load or offline
  private playSynthesizedFallback(soundId: string, volume = 0.8) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(Math.max(0.01, Math.min(1, volume * 0.4)), now);
      gain.connect(ctx.destination);

      if (soundId === 'urgent-alarm') {
        for (let i = 0; i < 4; i++) {
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 1250, now + i * 0.15);
          osc.connect(gain);
          osc.start(now + i * 0.15);
          osc.stop(now + (i + 1) * 0.15);
        }
      } else if (soundId === 'task-complete') {
        const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + idx * 0.1);
          osc.connect(gain);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.4);
        });
      } else {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(soundId === 'digital-beep' ? 950 : 880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.6);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch (e) {
      console.warn('Synthesizer fallback error:', e);
    }
  }

  public stopSound(): void {
    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }
    this.isLooping = false;

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (this.currentPreviewAudio) {
      this.currentPreviewAudio.pause();
      this.currentPreviewAudio.currentTime = 0;
      this.currentPreviewAudio = null;
    }
  }

  public async previewSound(soundId: string, volumePercentage = 80): Promise<void> {
    this.stopSound();

    const option = BUILTIN_RINGTONES.find((r) => r.id === soundId) ||
      (soundId === 'task-complete' ? COMPLETION_RINGTONE : BUILTIN_RINGTONES[0]);

    const audio = new Audio(option.file);
    audio.volume = Math.max(0, Math.min(1, volumePercentage / 100));
    this.currentPreviewAudio = audio;

    try {
      await audio.play();
    } catch (err) {
      console.warn('Audio preview play blocked or failed, using synth fallback:', err);
      this.playSynthesizedFallback(soundId, volumePercentage / 100);
    }
  }

  public async playSound(
    soundId: string,
    options: {
      volume?: number; // 0 to 100
      loopCount?: number; // e.g. 3 for alarm mode
      enabled?: boolean;
    } = {}
  ): Promise<void> {
    const { volume = 80, loopCount = 1, enabled = true } = options;
    if (!enabled || volume <= 0) return;

    this.stopSound();

    const option = BUILTIN_RINGTONES.find((r) => r.id === soundId) ||
      (soundId === 'task-complete' ? COMPLETION_RINGTONE : BUILTIN_RINGTONES[0]);

    let remainingLoops = loopCount;
    this.isLooping = true;

    const playCycle = async () => {
      if (!this.isLooping || remainingLoops <= 0) {
        this.stopSound();
        return;
      }

      remainingLoops -= 1;

      try {
        const audio = new Audio(option.file);
        audio.volume = Math.max(0, Math.min(1, volume / 100));
        this.currentAudio = audio;

        audio.onended = () => {
          if (this.isLooping && remainingLoops > 0) {
            this.loopTimeout = setTimeout(() => {
              playCycle();
            }, 1200);
          } else {
            this.stopSound();
          }
        };

        await audio.play();
      } catch (err) {
        console.warn('Notification audio playback failed, falling back to Web Audio:', err);
        this.playSynthesizedFallback(soundId, volume / 100);
        if (this.isLooping && remainingLoops > 0) {
          this.loopTimeout = setTimeout(() => {
            playCycle();
          }, 1500);
        } else {
          this.stopSound();
        }
      }
    };

    await playCycle();
  }

  // Convenience helper methods
  public playReminderSound(settings?: any): Promise<void> {
    const enabled = settings?.notificationSoundEnabled ?? true;
    const volume = settings?.notificationVolume ?? 80;
    const soundId = settings?.selectedReminderSound || 'classic-bell';
    const isAlarmMode = settings?.alarmMode ?? false;
    return this.playSound(soundId, { volume, enabled, loopCount: isAlarmMode ? 3 : 1 });
  }

  public playDeadlineSound(settings?: any): Promise<void> {
    const enabled = settings?.notificationSoundEnabled ?? true;
    const volume = settings?.notificationVolume ?? 80;
    const soundId = settings?.selectedDeadlineSound || 'digital-beep';
    const isAlarmMode = settings?.alarmMode ?? false;
    return this.playSound(soundId, { volume, enabled, loopCount: isAlarmMode ? 3 : 1 });
  }

  public playOverdueSound(settings?: any): Promise<void> {
    const enabled = settings?.notificationSoundEnabled ?? true;
    const volume = settings?.notificationVolume ?? 80;
    const soundId = settings?.selectedOverdueSound || 'urgent-alarm';
    const isAlarmMode = settings?.alarmMode ?? false;
    return this.playSound(soundId, { volume, enabled, loopCount: isAlarmMode ? 3 : 1 });
  }

  public playDailySummarySound(settings?: any): Promise<void> {
    const enabled = settings?.notificationSoundEnabled ?? true;
    const volume = settings?.notificationVolume ?? 80;
    const soundId = settings?.selectedDailySummarySound || 'soft-chime';
    return this.playSound(soundId, { volume, enabled, loopCount: 1 });
  }

  public playPomodoroSound(settings?: any): Promise<void> {
    const enabled = settings?.notificationSoundEnabled ?? true;
    const volume = settings?.notificationVolume ?? 80;
    const soundId = settings?.selectedPomodoroSound || 'focus-alert';
    return this.playSound(soundId, { volume, enabled, loopCount: 1 });
  }

  public playCompletionSound(settings?: any): Promise<void> {
    const enabled = (settings?.notificationSoundEnabled ?? true) && (settings?.completionSoundEnabled ?? true);
    const volume = settings?.notificationVolume ?? 80;
    const soundId = settings?.selectedCompletionSound || 'task-complete';
    return this.playSound(soundId, { volume, enabled, loopCount: 1 });
  }
}

export const notificationSoundService = new NotificationSoundService();
