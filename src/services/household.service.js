import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import localDb from '@/lib/db';
import { useAuthStore } from '@/stores/authStore';
import { enqueueWrite } from './offlineQueue';

/**
 * Get household data. Tries Firestore first, falls back to local cache.
 */
export async function getHousehold(householdId) {
  try {
    const docRef = doc(db, 'households', householdId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = { id: snap.id, ...snap.data() };
      await localDb.households.put(data);
      return { success: true, data };
    }
    return { success: false, error: 'not-found' };
  } catch {
    // Offline fallback
    const cached = await localDb.households.get(householdId);
    if (cached) return { success: true, data: cached };
    return { success: false, error: 'network-unavailable' };
  }
}

/**
 * Update household data with optimistic update pattern.
 */
export async function updateHousehold(householdId, data) {
  const uid = useAuthStore.getState().user?.uid;

  // 1. Get rollback snapshot
  const current = await localDb.households.get(householdId);

  // 2. Optimistic local update
  const updated = {
    ...current,
    ...data,
    lastModified: new Date().toISOString(),
    lastModifiedBy: uid,
  };
  await localDb.households.put(updated);

  // 3. Attempt Firestore write
  try {
    await updateDoc(doc(db, 'households', householdId), {
      ...data,
      lastModified: serverTimestamp(),
      lastModifiedBy: uid,
    });
    return { success: true, data: updated };
  } catch (err) {
    if (err.code === 'unavailable' || !navigator.onLine) {
      // Queue for later
      await enqueueWrite({
        collection: 'households',
        docId: householdId,
        operation: 'update',
        data: { ...data, lastModified: new Date().toISOString(), lastModifiedBy: uid },
      });
      return { success: true, data: updated };
    }
    // Rollback on real error
    if (current) await localDb.households.put(current);
    return { success: false, error: mapError(err) };
  }
}

/**
 * Get sensitive data for a household.
 */
export async function getSensitiveData(householdId) {
  try {
    const snap = await getDoc(doc(db, 'households', householdId, 'sensitive', householdId));
    if (snap.exists()) {
      return { success: true, data: snap.data() };
    }
    return { success: true, data: null };
  } catch {
    return { success: false, error: 'network-unavailable' };
  }
}

/**
 * Update sensitive data.
 */
export async function updateSensitiveData(householdId, data) {
  try {
    await setDoc(
      doc(db, 'households', householdId, 'sensitive', householdId),
      { ...data, lastModified: serverTimestamp(), lastModifiedBy: useAuthStore.getState().user?.uid },
      { merge: true },
    );
    return { success: true };
  } catch (err) {
    return { success: false, error: mapError(err) };
  }
}

/**
 * Get emergency contacts for a household.
 */
export async function getContacts(householdId) {
  try {
    const snap = await getDocs(collection(db, 'households', householdId, 'contacts'));
    const contacts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { success: true, data: contacts };
  } catch {
    const cached = await localDb.householdContacts.where('householdId').equals(householdId).toArray();
    return { success: true, data: cached };
  }
}

/**
 * Add an emergency contact.
 */
export async function addContact(householdId, contact) {
  try {
    const ref = await addDoc(collection(db, 'households', householdId, 'contacts'), contact);
    const data = { id: ref.id, householdId, ...contact };
    await localDb.householdContacts.put(data);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: mapError(err) };
  }
}

/**
 * Delete an emergency contact. Online only.
 */
export async function deleteContact(householdId, contactId) {
  try {
    await deleteDoc(doc(db, 'households', householdId, 'contacts', contactId));
    await localDb.householdContacts.delete(contactId);
    return { success: true };
  } catch (err) {
    return { success: false, error: mapError(err) };
  }
}

function mapError(err) {
  if (err.code === 'permission-denied') return 'permission-denied';
  if (err.code === 'not-found') return 'not-found';
  if (err.code === 'unavailable') return 'network-unavailable';
  return 'unknown';
}
