import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import localDb from '@/lib/db';

/**
 * Get neighborhood data.
 */
export async function getNeighborhood(neighborhoodId) {
  try {
    const snap = await getDoc(doc(db, 'neighborhoods', neighborhoodId));
    if (snap.exists()) {
      const data = { id: snap.id, ...snap.data() };
      await localDb.neighborhoods.put(data);
      return { success: true, data };
    }
    return { success: false, error: 'not-found' };
  } catch {
    const cached = await localDb.neighborhoods.get(neighborhoodId);
    if (cached) return { success: true, data: cached };
    return { success: false, error: 'network-unavailable' };
  }
}

/**
 * Get all households in a neighborhood.
 */
export async function getHouseholdsInNeighborhood(neighborhoodId) {
  try {
    const snap = await getDocs(
      query(collection(db, 'households'), where('neighborhoodId', '==', neighborhoodId)),
    );
    const households = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    for (const h of households) {
      await localDb.households.put(h);
    }
    return { success: true, data: households };
  } catch {
    const cached = await localDb.households.where('neighborhoodId').equals(neighborhoodId).toArray();
    return { success: true, data: cached };
  }
}

/**
 * Get vulnerable residents in a neighborhood.
 */
export async function getVulnerableResidents(neighborhoodId) {
  try {
    const snap = await getDocs(
      query(
        collection(db, 'households'),
        where('neighborhoodId', '==', neighborhoodId),
        where('hasVulnerableMembers', '==', true),
      ),
    );
    return { success: true, data: snap.docs.map((d) => ({ id: d.id, ...d.data() })) };
  } catch {
    const cached = await localDb.households
      .where('neighborhoodId')
      .equals(neighborhoodId)
      .filter((h) => h.hasVulnerableMembers)
      .toArray();
    return { success: true, data: cached };
  }
}

/**
 * Update rally point.
 */
export async function updateRallyPoint(neighborhoodId, type, data) {
  const field = type === 'primary' ? 'primaryRallyPoint' : 'backupRallyPoint';
  try {
    await updateDoc(doc(db, 'neighborhoods', neighborhoodId), { [field]: data });
    return { success: true };
  } catch {
    return { success: false, error: 'unknown' };
  }
}

/**
 * Activate emergency mode for a neighborhood.
 */
export async function activateEmergencyMode(neighborhoodId, eventName) {
  try {
    await updateDoc(doc(db, 'neighborhoods', neighborhoodId), {
      emergencyMode: true,
      emergencyEventName: eventName,
      emergencyActivatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch {
    return { success: false, error: 'unknown' };
  }
}

/**
 * Deactivate emergency mode.
 */
export async function deactivateEmergencyMode(neighborhoodId) {
  try {
    await updateDoc(doc(db, 'neighborhoods', neighborhoodId), {
      emergencyMode: false,
      emergencyEventName: null,
      emergencyActivatedAt: null,
      emergencyActivatedBy: null,
    });
    return { success: true };
  } catch {
    return { success: false, error: 'unknown' };
  }
}
