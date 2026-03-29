import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

try { initializeApp(); } catch (e) { /* already initialized */ }
const db = getFirestore();

/**
 * When a household is updated, check if address changed (re-geocode)
 * and trigger stat re-aggregation if needed.
 */
export const onHouseholdUpdate = onDocumentUpdated('households/{householdId}', async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!before || !after) return;

  const householdId = event.params.householdId;

  // Check if address changed — would need re-geocode
  if (before.address !== after.address && after.address) {
    // Re-geocode will be handled by the same logic as onHouseholdCreate
    // For now, mark as needing re-assignment
    await event.data.after.ref.update({
      assignmentStatus: 'pending-reassignment',
    });
  }

  // If neighborhood-relevant fields changed, trigger stat aggregation
  const relevantFields = ['status', 'hasVulnerableMembers', 'memberCount', 'profileComplete'];
  const changed = relevantFields.some((f) => before[f] !== after[f]);

  if (changed && after.neighborhoodId) {
    // Trigger aggregation by updating a sentinel field
    await db.collection('neighborhoods').doc(after.neighborhoodId).update({
      _lastHouseholdUpdate: FieldValue.serverTimestamp(),
    });
  }
});
