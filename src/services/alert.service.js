import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { collection, getDocs, query, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import localDb from '@/lib/db';
import { useAuthStore } from '@/stores/authStore';

let functions;
function getFns() {
  if (!functions) functions = getFunctions();
  return functions;
}

/**
 * Send a block-wide alert via Cloud Function.
 * Online only.
 */
export async function sendAlert({ neighborhoodId, title, body, type }) {
  try {
    const fn = httpsCallable(getFns(), 'sendBlockAlert');
    const result = await fn({ neighborhoodId, title, body, type });
    return { success: true, data: result.data };
  } catch (err) {
    return { success: false, error: 'unknown' };
  }
}

/**
 * Get alerts for a neighborhood.
 */
export async function getAlerts(neighborhoodId) {
  try {
    const snap = await getDocs(
      query(collection(db, 'alerts'), where('neighborhoodId', '==', neighborhoodId)),
    );
    const alerts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    for (const a of alerts) {
      await localDb.alerts.put(a);
    }
    return { success: true, data: alerts };
  } catch {
    const cached = await localDb.alerts.where('neighborhoodId').equals(neighborhoodId).toArray();
    return { success: true, data: cached };
  }
}

/**
 * Acknowledge an alert.
 */
export async function acknowledgeAlert(alertId) {
  const uid = useAuthStore.getState().user?.uid;
  try {
    await updateDoc(doc(db, 'alerts', alertId), {
      acknowledgedBy: arrayUnion(uid),
    });
    return { success: true };
  } catch {
    return { success: false, error: 'unknown' };
  }
}
