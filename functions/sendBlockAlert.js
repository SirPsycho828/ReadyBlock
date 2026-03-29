import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { initializeApp } from 'firebase-admin/app';

try { initializeApp(); } catch (e) { /* already initialized */ }
const db = getFirestore();

/**
 * Send a block-wide alert. Captain+ only. Online only.
 */
export const sendBlockAlert = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const { neighborhoodId, title, body, type } = request.data;
  if (!neighborhoodId || !title || !body) {
    throw new HttpsError('invalid-argument', 'Missing required fields.');
  }

  const uid = request.auth.uid;

  // Verify caller is captain for this neighborhood
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.data();
  const captainRoles = ['blockCaptain', 'neighborhoodCaptain', 'cityCountyCaptain'];

  if (!captainRoles.includes(userData?.role) || userData?.neighborhoodId !== neighborhoodId) {
    throw new HttpsError('permission-denied', 'Not authorized for this neighborhood.');
  }

  // Create alert document
  const alertRef = await db.collection('alerts').add({
    neighborhoodId,
    authorUid: uid,
    type: type || 'info',
    title,
    body,
    createdAt: FieldValue.serverTimestamp(),
    acknowledgedBy: [],
  });

  // Get all members for FCM push (future: implement FCM tokens)
  const membersSnap = await db
    .collection('neighborhoods')
    .doc(neighborhoodId)
    .collection('members')
    .get();

  const recipientCount = membersSnap.size;

  // Audit log
  await db.collection('auditLogs').add({
    action: 'alert.sent',
    actorUid: uid,
    actorRole: userData.role,
    targetCollection: 'alerts',
    targetDocId: alertRef.id,
    timestamp: FieldValue.serverTimestamp(),
    details: { neighborhoodId, type, title, recipientCount },
  });

  return { success: true, data: { alertId: alertRef.id, recipientCount } };
});
