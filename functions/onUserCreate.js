import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

// Ensure app is initialized (idempotent)
try { initializeApp(); } catch (e) { /* already initialized */ }
const db = getFirestore();

/**
 * When a new Firebase Auth user is created, initialize their Firestore user document.
 * Triggered by auth.user().onCreate in v1, but we use Firestore document creation
 * since the client creates a household doc on sign-up.
 *
 * For the user doc, we use an Auth trigger via onCall or a separate Auth trigger.
 * This function listens for the user's first household creation as the trigger.
 */
export const onUserCreate = onDocumentCreated('users/{uid}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const uid = event.params.uid;
  const data = snap.data();

  // Ensure role is set to unverified if not already set
  if (!data.role) {
    await snap.ref.update({
      role: 'unverified',
      createdAt: FieldValue.serverTimestamp(),
      lastLoginAt: FieldValue.serverTimestamp(),
    });
  }

  // Log the creation
  await db.collection('auditLogs').add({
    action: 'user.created',
    actorUid: uid,
    actorRole: 'unverified',
    targetCollection: 'users',
    targetDocId: uid,
    timestamp: FieldValue.serverTimestamp(),
    details: { email: data.email || null },
  });
});
