import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

try { initializeApp(); } catch (e) { /* already initialized */ }
const db = getFirestore();

/**
 * Activate or deactivate emergency mode for a neighborhood.
 * Captain+ only.
 */
export const activateEmergencyMode = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const { neighborhoodId, activate, eventName } = request.data;
  if (!neighborhoodId) {
    throw new HttpsError('invalid-argument', 'Neighborhood ID is required.');
  }

  const uid = request.auth.uid;

  // Verify captain role
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.data();
  const captainRoles = ['blockCaptain', 'neighborhoodCaptain', 'cityCountyCaptain'];

  if (!captainRoles.includes(userData?.role)) {
    throw new HttpsError('permission-denied', 'Captain role required.');
  }

  // City coordinators can activate any neighborhood; others only their own
  if (userData.role !== 'cityCountyCaptain' && userData.neighborhoodId !== neighborhoodId) {
    throw new HttpsError('permission-denied', 'Not authorized for this neighborhood.');
  }

  const neighborhoodRef = db.collection('neighborhoods').doc(neighborhoodId);

  if (activate) {
    await neighborhoodRef.update({
      emergencyMode: true,
      emergencyEventName: eventName || 'Emergency',
      emergencyActivatedAt: FieldValue.serverTimestamp(),
      emergencyActivatedBy: uid,
    });
  } else {
    await neighborhoodRef.update({
      emergencyMode: false,
      emergencyEventName: null,
      emergencyActivatedAt: null,
      emergencyActivatedBy: null,
    });
  }

  // Audit log
  await db.collection('auditLogs').add({
    action: activate ? 'emergency.activated' : 'emergency.deactivated',
    actorUid: uid,
    actorRole: userData.role,
    targetCollection: 'neighborhoods',
    targetDocId: neighborhoodId,
    timestamp: FieldValue.serverTimestamp(),
    details: { eventName, activate },
  });

  return { success: true };
});
