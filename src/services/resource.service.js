import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import localDb from '@/lib/db';
import { useAuthStore } from '@/stores/authStore';
import { enqueueWrite } from './offlineQueue';

export const RESOURCE_TYPES = [
  'medical',
  'power',
  'water',
  'foodShelter',
  'tools',
  'communications',
];

/**
 * Get all resources for a neighborhood.
 */
export async function getNeighborhoodResources(neighborhoodId) {
  try {
    const snap = await getDocs(
      query(collection(db, 'resources'), where('neighborhoodId', '==', neighborhoodId)),
    );
    const resources = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Cache locally
    for (const r of resources) {
      await localDb.resources.put(r);
    }
    return { success: true, data: resources };
  } catch {
    const cached = await localDb.resources.where('neighborhoodId').equals(neighborhoodId).toArray();
    return { success: true, data: cached };
  }
}

/**
 * Get resources for a specific household.
 */
export async function getHouseholdResources(householdId) {
  try {
    const snap = await getDocs(
      query(collection(db, 'resources'), where('householdId', '==', householdId)),
    );
    const resources = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { success: true, data: resources };
  } catch {
    const cached = await localDb.resources.where('householdId').equals(householdId).toArray();
    return { success: true, data: cached };
  }
}

/**
 * Add a resource.
 */
export async function addResource(resource) {
  const uid = useAuthStore.getState().user?.uid;
  const data = {
    ...resource,
    householdId: uid,
    lastVerified: serverTimestamp(),
    lastVerifiedBy: uid,
    createdAt: serverTimestamp(),
  };

  try {
    const ref = await addDoc(collection(db, 'resources'), data);
    const localData = { id: ref.id, ...resource, householdId: uid, createdAt: new Date().toISOString() };
    await localDb.resources.put(localData);
    return { success: true, data: localData };
  } catch (err) {
    if (!navigator.onLine) {
      const tempId = `temp_${Date.now()}`;
      const localData = { id: tempId, ...resource, householdId: uid, createdAt: new Date().toISOString() };
      await localDb.resources.put(localData);
      await enqueueWrite({ collection: 'resources', docId: tempId, operation: 'set', data: resource });
      return { success: true, data: localData };
    }
    return { success: false, error: 'unknown' };
  }
}

/**
 * Update a resource.
 */
export async function updateResource(resourceId, updates) {
  try {
    await updateDoc(doc(db, 'resources', resourceId), {
      ...updates,
      lastVerified: serverTimestamp(),
      lastVerifiedBy: useAuthStore.getState().user?.uid,
    });
    const cached = await localDb.resources.get(resourceId);
    if (cached) {
      await localDb.resources.put({ ...cached, ...updates });
    }
    return { success: true };
  } catch {
    return { success: false, error: 'unknown' };
  }
}

/**
 * Delete a resource.
 */
export async function deleteResource(resourceId) {
  try {
    await deleteDoc(doc(db, 'resources', resourceId));
    await localDb.resources.delete(resourceId);
    return { success: true };
  } catch {
    return { success: false, error: 'unknown' };
  }
}
