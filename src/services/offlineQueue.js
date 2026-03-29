import localDb from '@/lib/db';
import { useSyncStore } from '@/stores/syncStore';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const QUEUE_EXPIRY_MS = 72 * 60 * 60 * 1000; // 72 hours

/**
 * Add a write operation to the offline queue.
 * Persists across app close/reopen.
 */
export async function enqueueWrite({ collection, docId, operation, data }) {
  const now = Date.now();
  await localDb.offlineQueue.add({
    collection,
    docId,
    operation, // 'set' | 'update' | 'delete'
    data,
    createdAt: now,
    expiresAt: now + QUEUE_EXPIRY_MS,
    status: 'pending',
  });

  // Update queue count in store
  const count = await localDb.offlineQueue.where('status').equals('pending').count();
  useSyncStore.getState().setQueueCount(count);
  if (count > 0) {
    useSyncStore.getState().setStatus('queue-pending');
  }
}

/**
 * Attempt to flush all pending queued writes to Firestore.
 * Called on reconnect.
 */
export async function flushQueue() {
  const now = Date.now();

  // Remove expired items first
  await localDb.offlineQueue.where('expiresAt').below(now).delete();

  const pending = await localDb.offlineQueue
    .where('status')
    .equals('pending')
    .toArray();

  if (pending.length === 0) {
    useSyncStore.getState().setQueueCount(0);
    return { flushed: 0, failed: 0 };
  }

  let flushed = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      const ref = doc(db, item.collection, item.docId);

      switch (item.operation) {
        case 'set':
          await setDoc(ref, item.data, { merge: true });
          break;
        case 'update':
          await updateDoc(ref, item.data);
          break;
        case 'delete':
          await deleteDoc(ref);
          break;
      }

      // Remove from queue on success
      await localDb.offlineQueue.delete(item.id);
      flushed++;
    } catch {
      // Mark as failed but keep in queue for retry
      await localDb.offlineQueue.update(item.id, { status: 'failed' });
      failed++;
    }
  }

  // Update store
  const remaining = await localDb.offlineQueue.where('status').anyOf('pending', 'failed').count();
  useSyncStore.getState().setQueueCount(remaining);
  if (remaining === 0) {
    useSyncStore.getState().setStatus('synced');
  }

  return { flushed, failed };
}

/**
 * Get all items in the offline queue for display.
 */
export async function getQueueItems() {
  return localDb.offlineQueue.toArray();
}

/**
 * Cancel a single queued write.
 */
export async function cancelQueueItem(id) {
  await localDb.offlineQueue.delete(id);
  const count = await localDb.offlineQueue.count();
  useSyncStore.getState().setQueueCount(count);
  if (count === 0) {
    useSyncStore.getState().setStatus('synced');
  }
}

/**
 * Check if queue has items (used for sign-out warning).
 */
export async function hasQueuedWrites() {
  const count = await localDb.offlineQueue.count();
  return count > 0;
}
