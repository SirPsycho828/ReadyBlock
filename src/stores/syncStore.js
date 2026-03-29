import { create } from 'zustand';

/**
 * Sync status values:
 * 'synced'       — Online, fully synced (green dot)
 * 'syncing'      — Online, sync in progress (spinner)
 * 'failed'       — Online, sync failed (red dot)
 * 'offline'      — Offline, data current (gray dot + timestamp)
 * 'stale'        — Offline, data outdated (amber banner)
 * 'never-synced' — Never synced (red banner — critical)
 * 'reconnecting' — Reconnecting (spinner)
 * 'queue-pending'— Items in offline queue (badge count)
 */
export const useSyncStore = create((set) => ({
  status: 'synced',
  lastSynced: null,
  queueCount: 0,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

  setStatus: (status) => set({ status }),
  setLastSynced: (lastSynced) => set({ lastSynced }),
  setQueueCount: (queueCount) => set({ queueCount }),
  setIsOnline: (isOnline) => set({ isOnline }),

  reset: () =>
    set({
      status: 'synced',
      lastSynced: null,
      queueCount: 0,
      isOnline: true,
    }),
}));
