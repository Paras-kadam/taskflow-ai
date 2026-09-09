// Browser notification helper

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported in this browser.');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

export function sendBrowserNotification(
  title: string,
  options?: NotificationOptions & { url?: string }
): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(title, {
      icon: '/vite.svg',
      ...options,
    });

    if (options?.url) {
      notification.onclick = () => {
        window.focus();
        window.location.href = options.url!;
      };
    }

    return true;
  } catch (error) {
    console.error('Error showing browser notification:', error);
    return false;
  }
}

export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator && window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Service Worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('Service Worker registration skipped or failed:', err);
      });
  }
}
