import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

try { initializeApp(); } catch (e) { /* already initialized */ }
const db = getFirestore();

/**
 * Generate a preparedness report for a city or neighborhood.
 * Admin role required.
 */
export const generatePreparednessReport = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const uid = request.auth.uid;
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.data();

  if (userData?.role !== 'cityCountyCaptain') {
    throw new HttpsError('permission-denied', 'Admin role required.');
  }

  const { neighborhoodId, cityId } = request.data;

  let neighborhoods;
  if (neighborhoodId) {
    const nhDoc = await db.collection('neighborhoods').doc(neighborhoodId).get();
    neighborhoods = nhDoc.exists ? [{ id: nhDoc.id, ...nhDoc.data() }] : [];
  } else {
    const snap = await db.collection('neighborhoods').get();
    neighborhoods = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    generatedBy: uid,
    totalNeighborhoods: neighborhoods.length,
    averageScore: neighborhoods.length > 0
      ? Math.round(neighborhoods.reduce((s, n) => s + (n.preparednessScore || 0), 0) / neighborhoods.length)
      : 0,
    totalHouseholds: neighborhoods.reduce((s, n) => s + (n.householdCount || 0), 0),
    totalRegistered: neighborhoods.reduce((s, n) => s + (n.registeredCount || 0), 0),
    neighborhoods: neighborhoods.map((n) => ({
      id: n.id,
      name: n.name,
      score: n.preparednessScore || 0,
      households: n.householdCount || 0,
      registered: n.registeredCount || 0,
      hasEmergency: n.emergencyMode || false,
    })),
  };

  return { success: true, data: report };
});
