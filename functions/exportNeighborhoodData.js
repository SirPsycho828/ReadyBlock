import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

try { initializeApp(); } catch (e) { /* already initialized */ }
const db = getFirestore();

/**
 * Export neighborhood data as JSON.
 * Admin role required.
 */
export const exportNeighborhoodData = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const uid = request.auth.uid;
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.data();

  if (userData?.role !== 'cityCountyCaptain') {
    throw new HttpsError('permission-denied', 'Admin role required.');
  }

  const { neighborhoodId, format } = request.data;
  if (!neighborhoodId) {
    throw new HttpsError('invalid-argument', 'Neighborhood ID is required.');
  }

  // Gather all data
  const [householdsSnap, resourcesSnap, skillsSnap] = await Promise.all([
    db.collection('households').where('neighborhoodId', '==', neighborhoodId).get(),
    db.collection('resources').where('neighborhoodId', '==', neighborhoodId).get(),
    db.collection('skills').where('neighborhoodId', '==', neighborhoodId).get(),
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    neighborhoodId,
    households: householdsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    resources: resourcesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    skills: skillsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  };

  return { success: true, data };
});
