import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

try { initializeApp(); } catch (e) { /* already initialized */ }
const db = getFirestore();

/**
 * When a household is created, geocode the address and assign to a neighborhood.
 * Server-managed fields: neighborhoodId, lat, lng, assignmentStatus, cityId, assignedAt
 */
export const onHouseholdCreate = onDocumentCreated('households/{householdId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const data = snap.data();
  const householdId = event.params.householdId;
  const address = data.address;

  if (!address) {
    await snap.ref.update({ assignmentStatus: 'no-address' });
    return;
  }

  try {
    // Geocode the address using Google Maps API
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    let lat, lng;

    if (apiKey) {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.status === 'OK' && result.results.length > 0) {
        const location = result.results[0].geometry.location;
        lat = location.lat;
        lng = location.lng;
      } else {
        await snap.ref.update({ assignmentStatus: 'geocode-failed' });
        return;
      }
    } else {
      // No API key — mark as pending manual assignment
      await snap.ref.update({ assignmentStatus: 'pending-geocode' });
      return;
    }

    // Find which neighborhood contains this point (GeoJSON boundary lookup)
    const neighborhoodsSnap = await db.collection('neighborhoods').get();
    let assignedNeighborhood = null;

    for (const doc of neighborhoodsSnap.docs) {
      const neighborhood = doc.data();
      if (neighborhood.boundary && pointInBoundary(lat, lng, neighborhood.boundary)) {
        assignedNeighborhood = { id: doc.id, ...neighborhood };
        break;
      }
    }

    if (assignedNeighborhood) {
      // Assign to neighborhood
      await snap.ref.update({
        neighborhoodId: assignedNeighborhood.id,
        cityId: assignedNeighborhood.cityId || null,
        lat,
        lng,
        assignmentStatus: 'assigned',
        assignedAt: FieldValue.serverTimestamp(),
      });

      // Add to neighborhood members subcollection
      await db
        .collection('neighborhoods')
        .doc(assignedNeighborhood.id)
        .collection('members')
        .doc(householdId)
        .set({
          uid: householdId,
          role: 'householdMember',
          householdId,
          joinedAt: FieldValue.serverTimestamp(),
        });

      // Update the user's neighborhood assignment
      await db.collection('users').doc(householdId).update({
        neighborhoodId: assignedNeighborhood.id,
        cityId: assignedNeighborhood.cityId || null,
        role: 'householdMember',
      });
    } else {
      await snap.ref.update({
        lat,
        lng,
        assignmentStatus: 'unassigned',
      });
    }
  } catch (error) {
    console.error('Error in onHouseholdCreate:', error);
    await snap.ref.update({ assignmentStatus: 'geocode-failed' });
  }
});

/**
 * Simple point-in-polygon test using ray casting algorithm.
 * boundary is an array of { latitude, longitude } objects.
 */
function pointInBoundary(lat, lng, boundary) {
  if (!Array.isArray(boundary) || boundary.length < 3) return false;

  let inside = false;
  for (let i = 0, j = boundary.length - 1; i < boundary.length; j = i++) {
    const xi = boundary[i].latitude || boundary[i].lat;
    const yi = boundary[i].longitude || boundary[i].lng;
    const xj = boundary[j].latitude || boundary[j].lat;
    const yj = boundary[j].longitude || boundary[j].lng;

    const intersect =
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
