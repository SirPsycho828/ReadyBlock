import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import localDb from '@/lib/db';
import { useSyncStore } from '@/stores/syncStore';
import { useAuthStore } from '@/stores/authStore';
import { useNeighborhoodStore } from '@/stores/neighborhoodStore';
import { flushQueue } from './offlineQueue';
import { encryptData } from './encryption';

const TIER1_TIMEOUT_MS = 5000;

// Staleness thresholds (in days)
export const STALENESS_THRESHOLDS = {
  consumables: 90,
  equipment: 180,
  skills: 365,
  vulnerabilities: 180,
};

/**
 * Initialize sync — call on app open.
 * Pulls all neighborhood data to Dexie, then continues background sync.
 */
export async function initializeSync() {
  const { setStatus, setLastSynced, setIsOnline } = useSyncStore.getState();
  const isOnline = navigator.onLine;
  setIsOnline(isOnline);

  if (!isOnline) {
    // Check if we have any local data
    const meta = await localDb.syncMeta.get('households');
    if (meta) {
      setStatus('offline');
      setLastSynced(meta.lastSynced);
    } else {
      setStatus('never-synced');
    }
    return;
  }

  setStatus('syncing');

  try {
    // Tier 1: Critical data (blocks UI, 5s timeout)
    await Promise.race([
      syncTier1(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), TIER1_TIMEOUT_MS),
      ),
    ]);

    // Tier 2: Background standard data
    syncTier2().catch(console.error);

    // Tier 3: Background low-priority data
    syncTier3().catch(console.error);

    // Flush offline queue
    flushQueue().catch(console.error);

    const now = Date.now();
    setLastSynced(now);
    setStatus('synced');

    await localDb.syncMeta.put({ collection: 'lastSync', lastSynced: now });
  } catch (err) {
    if (err.message === 'timeout') {
      setStatus('stale');
    } else {
      setStatus('failed');
    }
  }
}

/**
 * Tier 1: Evacuation status, active alerts, broadcasts.
 * Blocks UI until complete (5s timeout).
 */
async function syncTier1() {
  const user = useAuthStore.getState().user;
  if (!user) return;

  // Get user's neighborhood
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const userData = userDoc.data();
  if (!userData?.neighborhoodId) return;

  const neighborhoodId = userData.neighborhoodId;

  // Fetch neighborhood document
  const nhDoc = await getDoc(doc(db, 'neighborhoods', neighborhoodId));
  if (nhDoc.exists()) {
    const nhData = { id: nhDoc.id, ...nhDoc.data() };
    await localDb.neighborhoods.put(nhData);
    useNeighborhoodStore.getState().setNeighborhood(nhData);

    if (nhData.emergencyMode) {
      useNeighborhoodStore.getState().setEmergencyMode(true, nhData.emergencyEventName);
    }
  }

  // Fetch active alerts
  const alertsSnap = await getDocs(
    query(collection(db, 'alerts'), where('neighborhoodId', '==', neighborhoodId)),
  );
  for (const alertDoc of alertsSnap.docs) {
    await localDb.alerts.put({ id: alertDoc.id, ...alertDoc.data() });
  }

  await localDb.syncMeta.put({ collection: 'tier1', lastSynced: Date.now() });
}

/**
 * Tier 2: Standard household, resources, contacts.
 * Background sync with stale indicator.
 */
async function syncTier2() {
  const user = useAuthStore.getState().user;
  if (!user) return;

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const userData = userDoc.data();
  if (!userData?.neighborhoodId) return;

  const neighborhoodId = userData.neighborhoodId;

  // Fetch all households in neighborhood
  const householdsSnap = await getDocs(
    query(collection(db, 'households'), where('neighborhoodId', '==', neighborhoodId)),
  );
  const households = [];
  for (const hDoc of householdsSnap.docs) {
    const hData = { id: hDoc.id, ...hDoc.data() };
    await localDb.households.put(hData);
    households.push(hData);
  }
  useNeighborhoodStore.getState().setHouseholds(households);

  // Fetch resources
  const resourcesSnap = await getDocs(
    query(collection(db, 'resources'), where('neighborhoodId', '==', neighborhoodId)),
  );
  for (const rDoc of resourcesSnap.docs) {
    await localDb.resources.put({ id: rDoc.id, ...rDoc.data() });
  }

  // Fetch skills
  const skillsSnap = await getDocs(
    query(collection(db, 'skills'), where('neighborhoodId', '==', neighborhoodId)),
  );
  for (const sDoc of skillsSnap.docs) {
    await localDb.skills.put({ id: sDoc.id, ...sDoc.data() });
  }

  // Sync own sensitive data (encrypted locally)
  try {
    const sensitiveSnap = await getDocs(
      collection(db, 'households', user.uid, 'sensitive'),
    );
    for (const sDoc of sensitiveSnap.docs) {
      const encrypted = await encryptData(user.uid, sDoc.data());
      await localDb.householdSensitive.put({
        id: sDoc.id,
        householdId: user.uid,
        encryptedData: encrypted,
      });
    }
  } catch {
    // Permission denied for non-owners is expected
  }

  await localDb.syncMeta.put({ collection: 'households', lastSynced: Date.now() });
}

/**
 * Tier 3: Coordinator notes, protocols, audit logs.
 * Background sync, no indicator.
 */
async function syncTier3() {
  const user = useAuthStore.getState().user;
  if (!user) return;

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const userData = userDoc.data();
  if (!userData?.neighborhoodId) return;

  const neighborhoodId = userData.neighborhoodId;
  const isCaptain = ['blockCaptain', 'neighborhoodCaptain', 'cityCountyCaptain'].includes(
    userData.role,
  );

  // Fetch protocols/action plans
  const protocolsSnap = await getDocs(
    query(collection(db, 'protocols'), where('neighborhoodId', '==', neighborhoodId)),
  );
  for (const pDoc of protocolsSnap.docs) {
    await localDb.protocols.put({ id: pDoc.id, ...pDoc.data() });
  }

  // Coordinator-only data
  if (isCaptain) {
    const notesSnap = await getDocs(
      query(
        collection(db, 'coordinatorNotes'),
        where('neighborhoodId', '==', neighborhoodId),
      ),
    );
    for (const nDoc of notesSnap.docs) {
      await localDb.coordinatorNotes.put({ id: nDoc.id, ...nDoc.data() });
    }
  }

  await localDb.syncMeta.put({ collection: 'tier3', lastSynced: Date.now() });
}

/**
 * Manual sync trigger (retry button).
 */
export async function manualSync() {
  return initializeSync();
}

/**
 * Check staleness of a data type.
 * Returns true if data is stale.
 */
export function isStale(lastVerified, type) {
  if (!lastVerified) return true;
  const threshold = STALENESS_THRESHOLDS[type] || 180;
  const daysSince = (Date.now() - new Date(lastVerified).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > threshold;
}
