import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { notificationSoundService } from '../../services/notificationSoundService';
import { Volume2, X } from 'lucide-react';

export function AudioPermissionPrompt() {
  const { user } = useAuthStore();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // If sounds are disabled in user settings, don't prompt
    const soundEnabled = user?.notificationSettings?.notificationSoundEnabled ?? true;
    if (!soundEnabled || dismissed) {
      setShowPrompt(false);
      return;
    }

    const checkUnlocked = () => {
      const unlocked = notificationSoundService.isAudioUnlocked();
      setShowPrompt(!unlocked);
    };

    checkUnlocked();
    const unsubscribe = notificationSoundService.onUnlockChange(() => {
      setShowPrompt(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user, dismissed]);

  const handleEnable = async () => {
    await notificationSoundService.unlockAudio();
    // Play a gentle short preview so user knows it's working
    notificationSoundService.previewSound('soft-chime', 40);
    setShowPrompt(false);
  };

  if (!showPrompt || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-violet-900/90 via-slate-900/90 to-violet-950/90 border-b border-violet-700/40 px-4 py-2.5 text-xs text-slate-200 flex items-center justify-between shadow-md animate-in slide-in-from-top-2 duration-200 z-30">
      <div className="flex items-center gap-2.5">
        <div className="p-1 rounded-md bg-violet-600/30 text-violet-300">
          <Volume2 className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <span className="font-semibold text-slate-100">Enable reminder ringtones?</span>
          <span className="hidden sm:inline text-slate-300 ml-1.5">
            Allow TaskFlow AI to play notification alarms and chimes.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleEnable}
          className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg shadow transition-colors text-xs flex items-center gap-1"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Enable Sounds</span>
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 text-slate-400 hover:text-slate-200 transition-colors rounded"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
