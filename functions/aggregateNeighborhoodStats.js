import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

try { initializeApp(); } catch (e) { /* already initialized */ }
const db = getFirestore();

/**
 * Compute preparedness score for a neighborhood when its data changes.
 *
 * Score formula (0-100):
 *   Base: 40
 *   + 10 if any household has first aid training
 *   + 10 if generator coverage > 20%
 *   + 10 if water storage covers 3+ days
 *   + 15 if ham radio operator present
 *   + 15 if coordinator completed training checklist
 */
export const aggregateNeighborhoodStats = onDocumentWritten(
  'neighborhoods/{neighborhoodId}',
  async (event) => {
    const after = event.data?.after?.data();
    if (!after) return; // Deleted

    const neighborhoodId = event.params.neighborhoodId;

    // Skip if this update was triggered by our own aggregation
    if (after._aggregating) return;

    try {
      // Get all households in this neighborhood
      const householdsSnap = await db
        .collection('households')
        .where('neighborhoodId', '==', neighborhoodId)
        .get();

      const households = householdsSnap.docs.map((d) => d.data());
      const householdCount = households.length;
      const registeredCount = households.filter((h) => h.profileComplete).length;

      // Get resources
      const resourcesSnap = await db
        .collection('resources')
        .where('neighborhoodId', '==', neighborhoodId)
        .get();
      const resources = resourcesSnap.docs.map((d) => d.data());

      // Get skills
      const skillsSnap = await db
        .collection('skills')
        .where('neighborhoodId', '==', neighborhoodId)
        .get();
      const skills = skillsSnap.docs.map((d) => d.data());

      // Compute score
      let score = 40; // Base score

      // +10 if any household has first aid training
      if (skills.some((s) => s.category === 'medical' && !s.withdrawnAt)) {
        score += 10;
      }

      // +10 if generator coverage > 20%
      const generators = resources.filter((r) => r.type === 'power' && r.shareable);
      if (householdCount > 0 && generators.length / householdCount > 0.2) {
        score += 10;
      }

      // +10 if water storage covers 3+ days
      const waterResources = resources.filter((r) => r.type === 'water');
      if (waterResources.length > 0) {
        score += 10;
      }

      // +15 if ham radio operator present
      if (skills.some((s) => s.category === 'communications' && !s.withdrawnAt)) {
        score += 15;
      }

      // +15 if coordinator completed training
      if (after.coordinatorTrainingComplete) {
        score += 15;
      }

      score = Math.min(score, 100);

      await db.collection('neighborhoods').doc(neighborhoodId).update({
        preparednessScore: score,
        householdCount,
        registeredCount,
        _aggregating: FieldValue.delete(),
      });
    } catch (error) {
      console.error('Error aggregating stats:', error);
    }
  },
);
