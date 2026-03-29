import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

try { initializeApp(); } catch (e) { /* already initialized */ }
const db = getFirestore();

/**
 * Validate a coordinator invite code and promote the user's role.
 */
export const validateCoordinatorInvite = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const { inviteCode } = request.data;
  if (!inviteCode) {
    throw new HttpsError('invalid-argument', 'Invite code is required.');
  }

  const uid = request.auth.uid;

  // Look up invite code
  const codesSnap = await db
    .collection('inviteCodes')
    .where('code', '==', inviteCode)
    .limit(1)
    .get();

  if (codesSnap.empty) {
    return { success: false, error: 'not-found' };
  }

  const codeDoc = codesSnap.docs[0];
  const codeData = codeDoc.data();

  if (codeData.redeemed) {
    return { success: false, error: 'already-redeemed' };
  }

  const role = codeData.role || 'blockCaptain';
  const neighborhoodId = codeData.neighborhoodId;

  // Promote user role
  await db.collection('users').doc(uid).update({
    role,
    neighborhoodId,
  });

  // Mark code as redeemed
  await codeDoc.ref.update({
    redeemed: true,
    redeemedBy: uid,
    redeemedAt: FieldValue.serverTimestamp(),
  });

  // Add to neighborhood members
  await db
    .collection('neighborhoods')
    .doc(neighborhoodId)
    .collection('members')
    .doc(uid)
    .set({
      uid,
      role,
      joinedAt: FieldValue.serverTimestamp(),
    });

  // Audit log
  await db.collection('auditLogs').add({
    action: 'role.promoted',
    actorUid: uid,
    actorRole: role,
    targetCollection: 'users',
    targetDocId: uid,
    timestamp: FieldValue.serverTimestamp(),
    details: { newRole: role, inviteCode, neighborhoodId },
  });

  return { success: true, data: { neighborhoodId, role } };
});
