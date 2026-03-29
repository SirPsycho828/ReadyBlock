/**
 * ReadyBlock Cloud Functions
 * Single entry point — all functions defined here with one initializeApp call.
 */
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

if (!getApps().length) initializeApp();

function getDb() {
  return getFirestore();
}

// ─── Firestore Triggers ────────────────────────────────────────────

/**
 * onUserCreate — initialize user document with unverified role
 */
export const onUserCreate = onDocumentCreated('users/{uid}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const uid = event.params.uid;
  const data = snap.data();

  if (!data.role) {
    await snap.ref.update({
      role: 'unverified',
      createdAt: FieldValue.serverTimestamp(),
      lastLoginAt: FieldValue.serverTimestamp(),
    });
  }

  await getDb().collection('auditLogs').add({
    action: 'user.created',
    actorUid: uid,
    actorRole: 'unverified',
    targetCollection: 'users',
    targetDocId: uid,
    timestamp: FieldValue.serverTimestamp(),
    details: { email: data.email || null },
  });
});

/**
 * onHouseholdCreate — geocode address, assign neighborhood
 */
export const onHouseholdCreate = onDocumentCreated('households/{householdId}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const data = snap.data();
  const householdId = event.params.householdId;

  if (!data.address) {
    await snap.ref.update({ assignmentStatus: 'no-address' });
    return;
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    let lat, lng;

    if (apiKey) {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(data.address)}&key=${apiKey}`;
      const response = await fetch(url);
      const result = await response.json();
      if (result.status === 'OK' && result.results.length > 0) {
        lat = result.results[0].geometry.location.lat;
        lng = result.results[0].geometry.location.lng;
      } else {
        await snap.ref.update({ assignmentStatus: 'geocode-failed' });
        return;
      }
    } else {
      await snap.ref.update({ assignmentStatus: 'pending-geocode' });
      return;
    }

    // Find neighborhood by boundary
    const neighborhoodsSnap = await getDb().collection('neighborhoods').get();
    let assigned = null;
    for (const ndoc of neighborhoodsSnap.docs) {
      const nh = ndoc.data();
      if (nh.boundary && pointInBoundary(lat, lng, nh.boundary)) {
        assigned = { id: ndoc.id, ...nh };
        break;
      }
    }

    if (assigned) {
      await snap.ref.update({
        neighborhoodId: assigned.id,
        cityId: assigned.cityId || null,
        lat, lng,
        assignmentStatus: 'assigned',
        assignedAt: FieldValue.serverTimestamp(),
      });
      await getDb().collection('neighborhoods').doc(assigned.id).collection('members').doc(householdId).set({
        uid: householdId, role: 'householdMember', householdId, joinedAt: FieldValue.serverTimestamp(),
      });
      await getDb().collection('users').doc(householdId).update({
        neighborhoodId: assigned.id, cityId: assigned.cityId || null, role: 'householdMember',
      }).catch(() => {});
    } else {
      await snap.ref.update({ lat, lng, assignmentStatus: 'unassigned' });
    }
  } catch (error) {
    console.error('onHouseholdCreate error:', error);
    await snap.ref.update({ assignmentStatus: 'geocode-failed' });
  }
});

/**
 * onHouseholdUpdate — re-aggregate on changes
 */
export const onHouseholdUpdate = onDocumentUpdated('households/{householdId}', async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!before || !after) return;

  const relevantFields = ['status', 'hasVulnerableMembers', 'memberCount', 'profileComplete'];
  const changed = relevantFields.some((f) => before[f] !== after[f]);

  if (changed && after.neighborhoodId) {
    await getDb().collection('neighborhoods').doc(after.neighborhoodId).update({
      _lastHouseholdUpdate: FieldValue.serverTimestamp(),
    }).catch(() => {});
  }
});

/**
 * auditLog — log role changes on user documents
 */
export const auditLog = onDocumentUpdated('users/{uid}', async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!before || !after || before.role === after.role) return;

  await getDb().collection('auditLogs').add({
    action: 'role.changed',
    actorUid: 'system',
    actorRole: 'system',
    targetCollection: 'users',
    targetDocId: event.params.uid,
    timestamp: FieldValue.serverTimestamp(),
    details: { previousRole: before.role, newRole: after.role },
  });
});

// ─── Callable Functions ────────────────────────────────────────────

/**
 * validateCoordinatorInvite — redeem invite code, promote role
 */
export const validateCoordinatorInvite = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in.');
  const { inviteCode } = request.data;
  if (!inviteCode) throw new HttpsError('invalid-argument', 'Invite code required.');

  const uid = request.auth.uid;
  const codesSnap = await getDb().collection('inviteCodes').where('code', '==', inviteCode).limit(1).get();
  if (codesSnap.empty) return { success: false, error: 'not-found' };

  const codeDoc = codesSnap.docs[0];
  const codeData = codeDoc.data();
  if (codeData.redeemed) return { success: false, error: 'already-redeemed' };

  const role = codeData.role || 'blockCaptain';
  const neighborhoodId = codeData.neighborhoodId;

  await getDb().collection('users').doc(uid).update({ role, neighborhoodId });
  await codeDoc.ref.update({ redeemed: true, redeemedBy: uid, redeemedAt: FieldValue.serverTimestamp() });
  await getDb().collection('neighborhoods').doc(neighborhoodId).collection('members').doc(uid).set({
    uid, role, joinedAt: FieldValue.serverTimestamp(),
  });
  await getDb().collection('auditLogs').add({
    action: 'role.promoted', actorUid: uid, actorRole: role,
    targetCollection: 'users', targetDocId: uid,
    timestamp: FieldValue.serverTimestamp(),
    details: { newRole: role, inviteCode, neighborhoodId },
  });

  return { success: true, data: { neighborhoodId, role } };
});

/**
 * sendBlockAlert — captain sends alert to all block members
 */
export const sendBlockAlert = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in.');
  const { neighborhoodId, title, body, type } = request.data;
  if (!neighborhoodId || !title || !body) throw new HttpsError('invalid-argument', 'Missing fields.');

  const uid = request.auth.uid;
  const userDoc = await getDb().collection('users').doc(uid).get();
  const userData = userDoc.data();
  const captainRoles = ['blockCaptain', 'neighborhoodCaptain', 'cityCountyCaptain'];
  if (!captainRoles.includes(userData?.role) || userData?.neighborhoodId !== neighborhoodId) {
    throw new HttpsError('permission-denied', 'Not authorized.');
  }

  const alertRef = await getDb().collection('alerts').add({
    neighborhoodId, authorUid: uid, type: type || 'info', title, body,
    createdAt: FieldValue.serverTimestamp(), acknowledgedBy: [],
  });
  const membersSnap = await getDb().collection('neighborhoods').doc(neighborhoodId).collection('members').get();

  return { success: true, data: { alertId: alertRef.id, recipientCount: membersSnap.size } };
});

/**
 * sendImAliveMessage — send SMS to designated contacts
 */
export const sendImAliveMessage = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in.');
  const uid = request.auth.uid;
  const { contacts } = request.data;
  if (!contacts?.length) throw new HttpsError('invalid-argument', 'Contacts required.');

  const userDoc = await getDb().collection('users').doc(uid).get();
  const userData = userDoc.data();
  const senderName = userData?.displayName || userData?.email || 'A ReadyBlock user';
  const message = `${senderName} has marked themselves as safe via ReadyBlock.`;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  const results = [];

  for (const contact of contacts.slice(0, 5)) {
    if (!contact.phone) continue;
    if (accountSid && authToken && fromNumber) {
      try {
        const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: contact.phone, From: fromNumber, Body: message }),
        });
        results.push({ phone: contact.phone, delivered: resp.ok, timestamp: new Date().toISOString() });
      } catch {
        results.push({ phone: contact.phone, delivered: false, timestamp: new Date().toISOString() });
      }
    } else {
      results.push({ phone: contact.phone, delivered: false, reason: 'sms-not-configured', timestamp: new Date().toISOString() });
    }
  }

  const deliveredCount = results.filter((r) => r.delivered).length;
  await getDb().collection('auditLogs').add({
    action: 'imAlive.sent', actorUid: uid, actorRole: userData?.role || 'unknown',
    targetCollection: 'users', targetDocId: uid,
    timestamp: FieldValue.serverTimestamp(),
    details: { contactCount: contacts.length, deliveredCount },
  });

  return { success: true, data: { deliveredCount, totalCount: contacts.length, results } };
});

/**
 * activateEmergencyMode — toggle emergency for a neighborhood
 */
export const activateEmergencyMode = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in.');
  const { neighborhoodId, activate, eventName } = request.data;
  if (!neighborhoodId) throw new HttpsError('invalid-argument', 'Neighborhood ID required.');

  const uid = request.auth.uid;
  const userDoc = await getDb().collection('users').doc(uid).get();
  const userData = userDoc.data();
  const captainRoles = ['blockCaptain', 'neighborhoodCaptain', 'cityCountyCaptain'];
  if (!captainRoles.includes(userData?.role)) throw new HttpsError('permission-denied', 'Captain role required.');
  if (userData.role !== 'cityCountyCaptain' && userData.neighborhoodId !== neighborhoodId) {
    throw new HttpsError('permission-denied', 'Not authorized for this neighborhood.');
  }

  const ref = getDb().collection('neighborhoods').doc(neighborhoodId);
  if (activate) {
    await ref.update({
      emergencyMode: true, emergencyEventName: eventName || 'Emergency',
      emergencyActivatedAt: FieldValue.serverTimestamp(), emergencyActivatedBy: uid,
    });
  } else {
    await ref.update({ emergencyMode: false, emergencyEventName: null, emergencyActivatedAt: null, emergencyActivatedBy: null });
  }

  await getDb().collection('auditLogs').add({
    action: activate ? 'emergency.activated' : 'emergency.deactivated',
    actorUid: uid, actorRole: userData.role,
    targetCollection: 'neighborhoods', targetDocId: neighborhoodId,
    timestamp: FieldValue.serverTimestamp(), details: { eventName, activate },
  });

  return { success: true };
});

/**
 * generatePreparednessReport — city-wide report
 */
export const generatePreparednessReport = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in.');
  const userDoc = await getDb().collection('users').doc(request.auth.uid).get();
  if (userDoc.data()?.role !== 'cityCountyCaptain') throw new HttpsError('permission-denied', 'Admin required.');

  const snap = await getDb().collection('neighborhoods').get();
  const neighborhoods = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return {
    success: true,
    data: {
      generatedAt: new Date().toISOString(),
      totalNeighborhoods: neighborhoods.length,
      averageScore: neighborhoods.length > 0
        ? Math.round(neighborhoods.reduce((s, n) => s + (n.preparednessScore || 0), 0) / neighborhoods.length) : 0,
      neighborhoods: neighborhoods.map((n) => ({
        id: n.id, name: n.name, score: n.preparednessScore || 0,
        households: n.householdCount || 0, registered: n.registeredCount || 0,
      })),
    },
  };
});

/**
 * exportNeighborhoodData — export as JSON
 */
export const exportNeighborhoodData = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in.');
  const userDoc = await getDb().collection('users').doc(request.auth.uid).get();
  if (userDoc.data()?.role !== 'cityCountyCaptain') throw new HttpsError('permission-denied', 'Admin required.');

  const { neighborhoodId } = request.data;
  if (!neighborhoodId) throw new HttpsError('invalid-argument', 'Neighborhood ID required.');

  const [householdsSnap, resourcesSnap, skillsSnap] = await Promise.all([
    db.collection('households').where('neighborhoodId', '==', neighborhoodId).get(),
    db.collection('resources').where('neighborhoodId', '==', neighborhoodId).get(),
    db.collection('skills').where('neighborhoodId', '==', neighborhoodId).get(),
  ]);

  return {
    success: true,
    data: {
      exportedAt: new Date().toISOString(), neighborhoodId,
      households: householdsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      resources: resourcesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      skills: skillsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    },
  };
});

// ─── Helpers ───────────────────────────────────────────────────────

function pointInBoundary(lat, lng, boundary) {
  if (!Array.isArray(boundary) || boundary.length < 3) return false;
  let inside = false;
  for (let i = 0, j = boundary.length - 1; i < boundary.length; j = i++) {
    const xi = boundary[i].latitude || boundary[i].lat;
    const yi = boundary[i].longitude || boundary[i].lng;
    const xj = boundary[j].latitude || boundary[j].lat;
    const yj = boundary[j].longitude || boundary[j].lng;
    const intersect = yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
