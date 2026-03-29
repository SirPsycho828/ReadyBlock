import { useEffect } from 'react';
import { useSyncStore } from '@/stores/syncStore';

export function useOnlineStatus() {
  const { isOnline, setIsOnline, setStatus } = useSyncStore();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setStatus('reconnecting');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline, setStatus]);

  return isOnline;
}
