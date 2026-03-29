/**
 * ReadyBlock Cloud Functions
 * Single entry point — all functions defined here with one initializeApp call.
 */
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

const googleMapsApiKey = defineSecret('GOOGLE_MAPS_API_KEY');

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
export const onHouseholdCreate = onDocumentCreated({ document: 'households/{householdId}', secrets: [googleMapsApiKey], timeoutSeconds: 60, memory: '512MiB' }, async (event) => {
  const snap = event.data;
  if (!snap) return;
  const data = snap.data();
  const householdId = event.params.householdId;

  // Skip seed data — it already has correct lat/lng/neighborhoodId
  if (data._seeded) return;

  if (!data.address) {
    await snap.ref.update({ assignmentStatus: 'no-address' });
    return;
  }

  try {
    const apiKey = googleMapsApiKey.value();
    if (!apiKey) {
      await snap.ref.update({ assignmentStatus: 'pending-geocode' });
      return;
    }

    // 1. Geocode the address
    console.log(`Geocoding: ${data.address}`);
    const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(data.address)}&key=${apiKey}`;
    const geoResp = await fetch(geoUrl);
    const geoResult = await geoResp.json();

    if (geoResult.status !== 'OK' || !geoResult.results.length) {
      console.log(`Geocode failed: ${geoResult.status}`);
      await snap.ref.update({ assignmentStatus: 'geocode-failed' });
      return;
    }

    const lat = geoResult.results[0].geometry.location.lat;
    const lng = geoResult.results[0].geometry.location.lng;
    console.log(`Geocoded to: ${lat}, ${lng}`);

    // 2. Search Asheville city neighborhoods (type: 'city') by centroid proximity
    const SEARCH_RADIUS = 0.03;
    const nearbySnap = await getDb().collection('neighborhoods')
      .where('type', '==', 'city')
      .get();

    console.log(`Checking ${nearbySnap.size} city neighborhoods...`);

    // Sort by centroid distance, check nearest first
    const candidates = [];
    for (const ndoc of nearbySnap.docs) {
      const nh = ndoc.data();
      if (!nh.boundary || nh.boundary.length < 3) continue;
      const dist = Math.hypot((nh.centroidLat || 0) - lat, (nh.centroidLng || 0) - lng);
      candidates.push({ id: ndoc.id, nh, dist });
    }
    candidates.sort((a, b) => a.dist - b.dist);

    let assigned = null;
    for (const { id, nh } of candidates) {
      if (pointInBoundary(lat, lng, nh.boundary)) {
        assigned = { id, ...nh };
        console.log(`Matched: ${nh.name} (${id})`);
        break;
      }
    }

    // Fallback: assign to nearest city neighborhood
    if (!assigned && candidates.length > 0) {
      const nearest = candidates[0];
      assigned = { id: nearest.id, ...nearest.nh };
      console.log(`No polygon match. Nearest: ${nearest.nh.name} (${nearest.id}, dist: ${nearest.dist.toFixed(4)})`);
    }

    if (assigned) {
      await snap.ref.update({
        neighborhoodId: assigned.id,
        cityId: assigned.cityId || 'buncombe-nc',
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

/**
 * seedNeighborhoods — ONE-TIME seed function. Remove after use.
 */
export const seedNeighborhoods = onRequest({ timeoutSeconds: 540, memory: '512MiB', cors: true }, async (req, res) => {
  const COUNTY_ID = 'buncombe-nc';
  const source = req.query.source || 'county';

  let created = 0;
  let total = 0;

  if (source === 'city') {
    // Asheville city neighborhoods
    const url = 'https://services.arcgis.com/aJ16ENn1AaqdFlqx/arcgis/rest/services/Neighborhoods/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson&outSR=4326&resultRecordCount=200';
    const resp = await fetch(url);
    const geojson = await resp.json();
    total = geojson.features.length;

    for (const feature of geojson.features) {
      const name = (feature.properties?.name || '').trim();
      if (!name) continue;
      const id = 'city-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const coords = feature.geometry.coordinates[0];
      const boundary = coords.map(([lng, lat]) => ({ lat, lng }));
      const centroidLat = boundary.reduce((s, p) => s + p.lat, 0) / boundary.length;
      const centroidLng = boundary.reduce((s, p) => s + p.lng, 0) / boundary.length;

      await getDb().collection('neighborhoods').doc(id).set({
        name, cityId: COUNTY_ID, type: 'city', boundary, centroidLat, centroidLng,
        emergencyMode: false, preparednessScore: 0, householdCount: 0, registeredCount: 0,
        organizationName: feature.properties.nameoforganization || '',
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      created++;
    }
  } else {
    // Buncombe County tax neighborhoods — full county coverage
    // Fetch in batches (API may limit results)
    let offset = 0;
    const batchSize = 100;
    let hasMore = true;

    while (hasMore) {
      const url = `https://services9.arcgis.com/p32OFU0tOg1QpCBl/arcgis/rest/services/Buncombe_County_Tax_Neighborhoods_2022/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson&outSR=4326&resultRecordCount=${batchSize}&resultOffset=${offset}`;
      const resp = await fetch(url);
      const geojson = await resp.json();

      if (!geojson.features || geojson.features.length === 0) {
        hasMore = false;
        break;
      }

      total += geojson.features.length;

      for (const feature of geojson.features) {
        // Try common field names for the neighborhood name
        const props = feature.properties || {};
        const name = (props.NHBD_NAME || props.NbhdName || props.NAME || props.name || props.OBJECTID || '').toString().trim();
        if (!name) continue;

        const id = 'county-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        // Handle MultiPolygon vs Polygon
        let coords;
        if (feature.geometry.type === 'MultiPolygon') {
          coords = feature.geometry.coordinates[0][0]; // largest ring
        } else {
          coords = feature.geometry.coordinates[0];
        }

        // Simplify large boundaries (keep every Nth point if > 200 points)
        if (coords.length > 200) {
          const step = Math.ceil(coords.length / 150);
          coords = coords.filter((_, i) => i % step === 0 || i === coords.length - 1);
        }

        const boundary = coords.map(([lng, lat]) => ({ lat, lng }));
        const centroidLat = boundary.reduce((s, p) => s + p.lat, 0) / boundary.length;
        const centroidLng = boundary.reduce((s, p) => s + p.lng, 0) / boundary.length;

        await getDb().collection('neighborhoods').doc(id).set({
          name, cityId: COUNTY_ID, type: 'county', boundary, centroidLat, centroidLng,
          emergencyMode: false, preparednessScore: 0, householdCount: 0, registeredCount: 0,
          createdAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        created++;
      }

      if (geojson.features.length < batchSize) {
        hasMore = false;
      } else {
        offset += batchSize;
      }
    }
  }

  res.json({ success: true, created, total, source });
});

/**
 * seedHouseholds — Populate every neighborhood with 5-10 households,
 * random resources, and 1-3 rally points. Also fixes existing
 * households missing lat/lng. Idempotent (uses deterministic IDs).
 *
 * GET /seedHouseholds
 * GET /seedHouseholds?clear=true  — delete existing seed data first
 */
export const seedHouseholds = onRequest({ timeoutSeconds: 540, memory: '1GiB', cors: true }, async (req, res) => {
  const db = getDb();

  // ── Debug mode: test boundary + point generation for a specific neighborhood ──
  if (req.query.debug) {
    const nhDoc = await db.collection('neighborhoods').doc(req.query.debug).get();
    if (!nhDoc.exists) return res.json({ error: 'not found', id: req.query.debug });
    const nh = nhDoc.data();
    const b = nh.boundary || [];
    const sample = b.slice(0, 3).map(p => ({ lat: p.lat, lng: p.lng, latType: typeof p.lat, lngType: typeof p.lng }));
    const cLat = b.reduce((s, p) => s + p.lat, 0) / b.length;
    const cLng = b.reduce((s, p) => s + p.lng, 0) / b.length;
    const testPts = [];
    let mnLa = Infinity, mxLa = -Infinity, mnLn = Infinity, mxLn = -Infinity;
    for (const p of b) {
      if (p.lat < mnLa) mnLa = p.lat; if (p.lat > mxLa) mxLa = p.lat;
      if (p.lng < mnLn) mnLn = p.lng; if (p.lng > mxLn) mxLn = p.lng;
    }
    for (let i = 0; i < 20; i++) {
      const la = mnLa + Math.random() * (mxLa - mnLa);
      const ln = mnLn + Math.random() * (mxLn - mnLn);
      testPts.push({ lat: la, lng: ln, inside: pointInBoundary(la, ln, b) });
    }
    // Also fetch actual seed households for this neighborhood
    const hhSnap = await db.collection('households')
      .where('neighborhoodId', '==', nhDoc.id)
      .where('_seeded', '==', true)
      .limit(15)
      .get();
    const seedHouseholds = hhSnap.docs.map(d => {
      const hd = d.data();
      return {
        id: d.id, lat: hd.lat, lng: hd.lng,
        inside: pointInBoundary(hd.lat, hd.lng, b),
      };
    });

    return res.json({
      id: nhDoc.id, name: nh.name, boundaryLen: b.length, sample,
      bbox: { mnLa, mxLa, mnLn, mxLn }, centroid: { lat: cLat, lng: cLng },
      centroidInside: pointInBoundary(cLat, cLng, b), testPts,
      storedCentroid: { lat: nh.centroidLat, lng: nh.centroidLng },
      seedHouseholds,
    });
  }

  // ── Data pools ──
  const FIRST = ['James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','David','Elizabeth','William','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Charles','Karen','Chris','Nancy','Daniel','Lisa','Matt','Betty','Tony','Sandra','Mark','Ashley','Don','Kim','Steven','Donna','Paul','Emily','Andrew','Michelle','Josh','Carol','Ken','Amanda','Kevin','Melissa','Brian','Deborah','George','Steph','Ed','Laura','Ron','Cynthia','Tim','Janet','Jason','Ruth','Jeff','Maria','Ryan','Catherine','Jacob','Heather','Gary','Diane','Nick','Olivia','Eric','Julie'];
  const LAST = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Torres','Hill','Flores','Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts','Gomez','Phillips','Evans','Turner','Diaz','Parker','Cruz','Edwards','Collins','Reyes','Stewart','Morris','Morales','Murphy','Cook','Rogers','Morgan','Peterson','Cooper','Reed','Bailey','Bell','Howard','Ward','Cox','Russell','Patel','Kim','Chen','Nguyen','Yamamoto','Tanaka','Okafor','Owusu'];
  const STREETS = ['Haywood Rd','Patton Ave','Merrimon Ave','Charlotte St','Broadway St','Biltmore Ave','Tunnel Rd','Hendersonville Rd','Sweeten Creek Rd','New Leicester Hwy','Fairview Rd','Smoky Park Hwy','Brevard Rd','Sand Hill Rd','Riverside Dr','Montford Ave','Pearson Dr','Kimberly Ave','College St','Walnut St','Lexington Ave','Page Ave','Clingman Ave','Hilliard Ave','Elk Mountain Rd','Weaverville Hwy','Swannanoa River Rd','Kenilworth Rd','Overlook Rd','Town Mountain Rd','Sunset Dr','Liberty Rd','Louisiana Ave','Craven St','Flint St','Meadow Rd','Burlington Ave','Westwood Pl','Forest Hill Dr','Springdale Ave','Cedar Hill Dr','Lakeshore Dr','Dogwood Rd','Maple St','Oak Forest Dr','Pinecrest Rd'];
  const RESOURCES = {
    medical: ['First aid kit','AED','Blood pressure monitor','Medical oxygen tank','Emergency medication supply','Trauma kit'],
    power: ['Honda EU2200i generator','Solar panel array','EcoFlow battery bank','Propane generator','Car inverter','UPS battery backup'],
    water: ['55-gal water drum','LifeStraw filter','Rain barrel system','Water purification tablets','5-gal water jugs (x4)','Berkey water filter'],
    foodShelter: ['72-hr emergency food kit','Freeze-dried food supply','Camp stove + fuel','Emergency tent','Sleeping bags (x4)','MRE case (12 meals)'],
    tools: ['Chainsaw','Tool set','Tarps (x6)','Come-along winch','Pry bar set','Rope (200ft)','Work gloves (12 pairs)'],
    communications: ['Ham radio (Baofeng UV-5R)','CB radio','NOAA weather radio','Satellite communicator (Garmin inReach)','Walkie-talkies (x4)','Signal mirror + whistle kit'],
  };
  const RALLY_NAMES = ['Community Center','Park Pavilion','Church Parking Lot','Elementary School','Fire Station','Library','Recreation Center','Town Square','Ballfield','Trailhead'];
  const LOCATIONS = ['home','garage','shed','basement','vehicle','closet'];
  const TYPES = Object.keys(RESOURCES);

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function randomPointIn(boundary) {
    let mnLa = Infinity, mxLa = -Infinity, mnLn = Infinity, mxLn = -Infinity;
    for (const p of boundary) {
      if (p.lat < mnLa) mnLa = p.lat; if (p.lat > mxLa) mxLa = p.lat;
      if (p.lng < mnLn) mnLn = p.lng; if (p.lng > mxLn) mxLn = p.lng;
    }
    for (let t = 0; t < 200; t++) {
      const la = mnLa + Math.random() * (mxLa - mnLa);
      const ln = mnLn + Math.random() * (mxLn - mnLn);
      if (pointInBoundary(la, ln, boundary)) return { lat: la, lng: ln };
    }
    return { lat: boundary.reduce((s, p) => s + p.lat, 0) / boundary.length, lng: boundary.reduce((s, p) => s + p.lng, 0) / boundary.length };
  }

  // ── Optionally clear previous seed data ──
  if (req.query.clear === 'true') {
    const oldHH = await db.collection('households').where('_seeded', '==', true).get();
    const oldRes = await db.collection('resources').where('_seeded', '==', true).get();
    let b = db.batch(), n = 0;
    for (const d of [...oldHH.docs, ...oldRes.docs]) { b.delete(d.ref); n++; if (n >= 400) { await b.commit(); b = db.batch(); n = 0; } }
    // Also delete seed neighborhood members
    const nhSnap2 = await db.collection('neighborhoods').get();
    for (const nhDoc of nhSnap2.docs) {
      const memSnap = await nhDoc.ref.collection('members').where('_seeded', '==', true).get();
      for (const m of memSnap.docs) { b.delete(m.ref); n++; if (n >= 400) { await b.commit(); b = db.batch(); n = 0; } }
    }
    if (n > 0) await b.commit();
  }

  // ── Seed neighborhoods (optionally filter by ?nh=id) ──
  const filterNh = req.query.nh; // seed only this neighborhood
  const nhSnap = filterNh
    ? await Promise.resolve({ docs: [(await db.collection('neighborhoods').doc(filterNh).get())].filter(d => d.exists) })
    : await db.collection('neighborhoods').get();
  const stats = { neighborhoods: 0, households: 0, resources: 0, rallyPoints: 0, fixed: 0 };
  let batch = db.batch(), bc = 0;
  async function flush() { if (bc > 0) { await batch.commit(); batch = db.batch(); bc = 0; } }
  async function add(ref, data) { batch.set(ref, data); bc++; if (bc >= 400) await flush(); }

  for (const nhDoc of nhSnap.docs) {
    const nh = nhDoc.data();
    if (!nh.boundary || nh.boundary.length < 3) continue;
    const nhId = nhDoc.id;
    const hhCount = randInt(5, 10);

    // Households
    for (let i = 0; i < hhCount; i++) {
      const id = `seed-${nhId}-${i}`;
      const { lat, lng } = randomPointIn(nh.boundary);
      const members = randInt(1, 5);
      const adults = Math.min(members, randInt(1, 3));

      await add(db.collection('households').doc(id), {
        _seeded: true,
        displayName: `${pick(FIRST)} ${pick(LAST)}`,
        lat, lng,
        neighborhoodId: nhId,
        cityId: nh.cityId || 'asheville-nc',
        assignmentStatus: 'assigned',
        assignedAt: FieldValue.serverTimestamp(),
        status: 'active',
        memberCount: members,
        adultCount: adults,
        childCount: members - adults,
        petType: Math.random() > 0.6 ? pick(['dog','cat','dog and cat']) : '',
        petCount: Math.random() > 0.6 ? randInt(1, 3) : 0,
        languagesSpoken: Math.random() > 0.8 ? ['en','es'] : ['en'],
        profileComplete: true,
        hasVulnerableMembers: Math.random() > 0.75,
        evacuationStatus: 'safe',
        enteredBy: id,
        isCoordinatorEntered: false,
        createdAt: FieldValue.serverTimestamp(),
        lastModified: FieldValue.serverTimestamp(),
      });

      // 1-3 resources per household
      const rc = randInt(1, 3);
      for (let j = 0; j < rc; j++) {
        const t = pick(TYPES);
        await add(db.collection('resources').doc(`seed-res-${nhId}-${i}-${j}`), {
          _seeded: true,
          type: t,
          name: pick(RESOURCES[t]),
          quantity: randInt(1, 3),
          condition: pick(['good','good','fair']),
          shareable: Math.random() > 0.25,
          location: pick(LOCATIONS),
          requiresTraining: t === 'communications' || t === 'medical' ? Math.random() > 0.5 : false,
          householdId: id,
          neighborhoodId: nhId,
          lastVerified: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        });
        stats.resources++;
      }

      // Neighborhood member
      await add(db.collection('neighborhoods').doc(nhId).collection('members').doc(id), {
        _seeded: true, uid: id, role: 'householdMember', householdId: id, joinedAt: FieldValue.serverTimestamp(),
      });
      stats.households++;
    }

    // Rally points (1-3)
    const rc = randInt(1, 3);
    const p1 = randomPointIn(nh.boundary);
    const rallyUpdate = {
      primaryRallyPoint: { name: `${nh.name} ${pick(RALLY_NAMES)}`, lat: p1.lat, lng: p1.lng, description: 'Primary emergency gathering location' },
      householdCount: FieldValue.increment(hhCount),
      registeredCount: FieldValue.increment(hhCount),
      preparednessScore: randInt(15, 80),
    };
    stats.rallyPoints++;
    if (rc >= 2) {
      const p2 = randomPointIn(nh.boundary);
      rallyUpdate.backupRallyPoint = { name: `${nh.name} ${pick(RALLY_NAMES)}`, lat: p2.lat, lng: p2.lng, description: 'Backup gathering location' };
      stats.rallyPoints++;
    }
    batch.update(nhDoc.ref, rallyUpdate);
    bc++; if (bc >= 400) await flush();
    stats.neighborhoods++;
  }

  // ── Fix existing households missing lat/lng ──
  const allHH = await db.collection('households').get();
  for (const doc of allHH.docs) {
    const d = doc.data();
    if (d._seeded) continue; // skip seed data
    if (d.neighborhoodId && (!d.lat || !d.lng)) {
      const nhDoc = nhSnap.docs.find((n) => n.id === d.neighborhoodId);
      if (nhDoc) {
        const nh = nhDoc.data();
        if (nh.boundary && nh.boundary.length >= 3) {
          const { lat, lng } = randomPointIn(nh.boundary);
          batch.update(doc.ref, { lat, lng, assignmentStatus: 'assigned' });
          bc++; if (bc >= 400) await flush();
          stats.fixed++;
        }
      }
    }
  }

  await flush();
  res.json({ success: true, stats });
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
