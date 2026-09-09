import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import clsx from 'clsx';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={clsx(
        'w-full py-2 px-4 flex items-center justify-center gap-2 text-xs font-medium transition-all duration-300 z-50',
        !isOnline
          ? 'bg-amber-500/20 text-amber-200 border-b border-amber-500/30'
          : 'bg-emerald-500/20 text-emerald-200 border-b border-emerald-500/30'
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>You're currently offline. Actions will sync when connection is restored.</span>
        </>
      ) : (
        <>
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span>Connection restored — you're back online!</span>
        </>
      )}
    </div>
  );
}
