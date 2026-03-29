import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

try { initializeApp(); } catch (e) { /* already initialized */ }
const db = getFirestore();

/**
 * Automatically audit log role changes on user documents.
 * All role changes MUST go through Cloud Functions, but this is a safety net.
 */
export const auditLog = onDocumentUpdated('users/{uid}', async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!before || !after) return;

  // Only log if role actually changed
  if (before.role === after.role) return;

  const uid = event.params.uid;

  await db.collection('auditLogs').add({
    action: 'role.changed',
    actorUid: 'system',
    actorRole: 'system',
    targetCollection: 'users',
    targetDocId: uid,
    timestamp: FieldValue.serverTimestamp(),
    details: {
      previousRole: before.role,
      newRole: after.role,
    },
  });
});
