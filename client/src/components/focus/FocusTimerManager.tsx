import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusStore } from '../../stores/focusStore';
import { useAuthStore } from '../../stores/authStore';
import { focusAPI } from '../../services/api';
import { sendBrowserNotification } from '../../services/browserNotification';
import { notificationSoundService } from '../../services/notificationSoundService';
import { useToast } from '../ui/Toast';

export function FocusTimerManager() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const status = useFocusStore((s) => s.status);
  const soundEnabled = useFocusStore((s) => s.soundEnabled);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    const handleCompletion = async (completedSession: { duration: number; type: string; taskId?: string }) => {
      // Play sound alert
      if (soundEnabled) {
        notificationSoundService.playPomodoroSound(user?.notificationSettings);
      }

      if (completedSession.type === 'pomodoro') {
        sendBrowserNotification('Pomodoro Completed! 🎉', {
          body: 'Great focus session! Time for a well-deserved break.',
        });
        showToast({ title: 'Pomodoro Completed! 🎉', message: 'Time for a well-deserved break.', type: 'success' });

        try {
          await focusAPI.logFocusSession({
            duration: completedSession.duration,
            type: completedSession.type,
            taskId: completedSession.taskId,
          });
          queryClient.invalidateQueries({ queryKey: ['focus_sessions'] });
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
        } catch (error) {
          console.error('Failed to log focus session:', error);
        }
      } else {
        sendBrowserNotification('Break is Over! ⚡', {
          body: 'Ready to dive back into your next productive focus session?',
        });
        showToast({ title: 'Break is Over! ⚡', message: 'Ready for your next focus session?', type: 'info' });
      }
    };

    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        const { isCompleted, completedSession } = useFocusStore.getState().tick();
        if (isCompleted && completedSession) {
          handleCompletion(completedSession);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, soundEnabled, user, queryClient, showToast]);

  // Handle visibility & window focus reconciliations (against sleep / throttling)
  useEffect(() => {
    const handleReconcile = () => {
      const store = useFocusStore.getState();
      if (store.status === 'running') {
        const { isCompleted, completedSession } = store.tick();
        if (isCompleted && completedSession) {
          if (store.soundEnabled) {
            notificationSoundService.playPomodoroSound(user?.notificationSettings);
          }
          if (completedSession.type === 'pomodoro') {
            sendBrowserNotification('Pomodoro Completed! 🎉', {
              body: 'Great focus session! Time for a well-deserved break.',
            });
            focusAPI.logFocusSession(completedSession).then(() => {
              queryClient.invalidateQueries({ queryKey: ['focus_sessions'] });
              queryClient.invalidateQueries({ queryKey: ['analytics'] });
            }).catch(console.error);
          } else {
            sendBrowserNotification('Break is Over! ⚡', {
              body: 'Ready to dive back into your next productive focus session?',
            });
          }
        }
      }
    };

    window.addEventListener('visibilitychange', handleReconcile);
    window.addEventListener('focus', handleReconcile);

    return () => {
      window.removeEventListener('visibilitychange', handleReconcile);
      window.removeEventListener('focus', handleReconcile);
    };
  }, [user, queryClient]);

  return null;
}
