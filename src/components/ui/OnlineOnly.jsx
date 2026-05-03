import { useSyncStore } from '@/stores/syncStore';

/**
 * Wraps children that require network connectivity.
 * When offline, renders them grayed-out and non-interactive.
 */
export function OnlineOnly({ children, fallbackText = 'Available when online' }) {
  const isOnline = useSyncStore((s) => s.isOnline);

  if (isOnline) return children;

  return (
    <div className="relative" title={fallbackText}>
      <div className="opacity-40 pointer-events-none grayscale select-none" aria-disabled="true">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="rounded-full bg-[#2A2A2A] px-3 py-1 text-xs font-medium text-amber-300 shadow-lg">
          {fallbackText}
        </span>
      </div>
    </div>
  );
}
