import { httpsCallable, getFunctions } from 'firebase/functions';
import localDb from '@/lib/db';
import { enqueueWrite } from './offlineQueue';

let functions;
function getFns() {
  if (!functions) functions = getFunctions();
  return functions;
}

/**
 * Send "I'm Alive" message to pre-designated contacts.
 * Queues offline and sends on reconnect. 60-second undo window.
 */
export async function sendImAlive(contacts) {
  if (!navigator.onLine) {
    // Queue for later delivery
    await enqueueWrite({
      collection: '_imAlive',
      docId: `imAlive_${Date.now()}`,
      operation: 'set',
      data: { contacts, queuedAt: new Date().toISOString() },
    });
    return { success: true, data: { queued: true, deliveredCount: 0, totalCount: contacts.length } };
  }

  try {
    const fn = httpsCallable(getFns(), 'sendImAliveMessage');
    const result = await fn({ contacts });
    return { success: true, data: result.data };
  } catch {
    // Queue on failure
    await enqueueWrite({
      collection: '_imAlive',
      docId: `imAlive_${Date.now()}`,
      operation: 'set',
      data: { contacts, queuedAt: new Date().toISOString() },
    });
    return { success: true, data: { queued: true, deliveredCount: 0, totalCount: contacts.length } };
  }
}

/**
 * Get designated "I'm Alive" contacts from local storage.
 */
export async function getImAliveContacts(householdId) {
  try {
    const contacts = await localDb.householdContacts
      .where('householdId')
      .equals(householdId)
      .toArray();
    return contacts.filter((c) => c.isImAliveContact).slice(0, 5);
  } catch {
    return [];
  }
}
