import { WifiOff, Clock } from 'lucide-react';
import { useSyncStore } from '@/stores/syncStore';

function formatRelativeTime(timestamp) {
  if (!timestamp) return null;
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function OfflineBanner() {
  const isOnline = useSyncStore((s) => s.isOnline);
  const lastSynced = useSyncStore((s) => s.lastSynced);

  if (isOnline) return null;

  const timeStr = formatRelativeTime(lastSynced);

  return (
    <div
      className="offline-banner sticky top-12 z-30 flex items-center justify-center gap-2 border-b-2 border-amber-500/60 bg-[#2A2A2A] px-4 py-2.5 text-sm font-medium text-amber-100"
      role="status"
      aria-live="polite"
    >
      <WifiOff size={16} className="shrink-0 text-amber-400" aria-hidden="true" />
      <span>You're offline — showing cached data</span>
      {timeStr && (
        <span className="flex items-center gap-1 text-xs text-amber-100/60">
          <Clock size={12} aria-hidden="true" />
          Last sync: {timeStr}
        </span>
      )}
    </div>
  );
}
