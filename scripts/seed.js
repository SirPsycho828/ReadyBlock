/**
 * ReadyBlock Seed Script
 * Creates 10-15 demo profiles with varied statuses + demo captain + admin accounts.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/seed.js
 *
 * Or with Firebase Emulator:
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/seed.js
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize with emulator or service account
const app = initializeApp();
const db = getFirestore();
const auth = getAuth();

const NEIGHBORHOOD_ID = 'montford-north';
const CITY_ID = 'asheville-nc';

const NEIGHBORHOOD = {
  name: 'Montford North',
  cityId: CITY_ID,
  boundary: [
    { lat: 35.605, lng: -82.560 },
    { lat: 35.605, lng: -82.545 },
    { lat: 35.595, lng: -82.545 },
    { lat: 35.595, lng: -82.560 },
  ],
  captainUid: null, // set after captain created
  joinCode: 'MONTFORD2024',
  primaryRallyPoint: {
    name: 'Montford Park',
    lat: 35.600,
    lng: -82.552,
    description: 'Pavilion near the playground — look for the ReadyBlock flag.',
  },
  backupRallyPoint: {
    name: 'First Baptist Church parking lot',
    lat: 35.598,
    lng: -82.555,
    description: 'West side of the lot, near the basketball court.',
  },
  emergencyMode: false,
  preparednessScore: 72,
  householdCount: 12,
  registeredCount: 10,
  createdAt: FieldValue.serverTimestamp(),
};

const DEMO_USERS = [
  // Block Captain
  {
    email: 'captain@readyblock.demo',
    password: 'REDACTED_PASSWORD',
    displayName: 'Sarah Chen',
    role: 'blockCaptain',
    household: {
      address: '401 Montford Ave, Asheville, NC 28801',
      memberCount: 3, adultCount: 2, childCount: 1,
      petType: 'Dog', petCount: 1,
      languagesSpoken: ['en', 'zh'],
      status: 'active', profileComplete: true,
      hasVulnerableMembers: false,
    },
    resources: [
      { type: 'power', name: 'Honda EU2200i Generator', quantity: 1, condition: 'good', shareable: true, location: 'home', requiresTraining: false },
      { type: 'communications', name: 'Baofeng UV-5R Ham Radio', quantity: 2, condition: 'good', shareable: true, location: 'home', requiresTraining: true },
    ],
    skills: [
      { category: 'medical', level: 'certified', equipment: ['first aid kit'] },
      { category: 'communications', level: 'certified', equipment: ['ham radio'] },
    ],
  },
  // City/County Admin
  {
    email: 'admin@readyblock.demo',
    password: 'REDACTED_PASSWORD',
    displayName: 'Marcus Johnson',
    role: 'cityCountyCaptain',
    household: {
      address: '100 City Hall Plaza, Asheville, NC 28801',
      memberCount: 2, adultCount: 2, childCount: 0,
      status: 'active', profileComplete: true,
    },
  },
  // Regular households with varied statuses
  {
    email: 'martinez@readyblock.demo',
    password: 'REDACTED_PASSWORD',
    displayName: 'Rosa Martinez',
    role: 'householdMember',
    household: {
      address: '412 Oak St, Asheville, NC 28801',
      memberCount: 5, adultCount: 2, childCount: 3,
      petType: 'Cat', petCount: 2,
      languagesSpoken: ['es', 'en'],
      status: 'active', profileComplete: true,
      hasVulnerableMembers: true,
      evacuationStatus: 'needHelp',
      needType: 'medical',
    },
    sensitive: {
      medicalEquipment: true,
      mobilityLimitation: false,
      checkOnMeFirst: true,
      sharingScope: 'coordinatorOnly',
    },
  },
  {
    email: 'lee@readyblock.demo',
    password: 'REDACTED_PASSWORD',
    displayName: 'James Lee',
    role: 'householdMember',
    household: {
      address: '406 Oak St, Asheville, NC 28801',
      memberCount: 2, adultCount: 2, childCount: 0,
      languagesSpoken: ['en', 'ko'],
      status: 'active', profileComplete: true,
      hasVulnerableMembers: false,
    },
    resources: [
      { type: 'tools', name: 'Chainsaw + hand tools', quantity: 1, condition: 'good', shareable: true, location: 'home', requiresTraining: true },
    ],
    skills: [
      { category: 'construction', level: 'trained', equipment: ['chainsaw', 'hand tools'] },
    ],
  },
  {
    email: 'patel@readyblock.demo',
    password: 'REDACTED_PASSWORD',
    displayName: 'Priya Patel',
    role: 'householdMember',
    household: {
      address: '420 Montford Ave, Asheville, NC 28801',
      memberCount: 4, adultCount: 2, childCount: 2,
      languagesSpoken: ['en'],
      status: 'active', profileComplete: true,
      evacuationStatus: 'safe',
    },
    resources: [
      { type: 'water', name: '50-gallon water storage', quantity: 2, condition: 'good', shareable: true, location: 'home', requiresTraining: false },
      { type: 'foodShelter', name: 'Extra room for 2 people', quantity: 1, condition: 'good', shareable: true, location: 'home', requiresTraining: false },
    ],
  },
  {
    email: 'wilson@readyblock.demo',
    password: 'REDACTED_PASSWORD',
    displayName: 'Tom Wilson',
    role: 'householdMember',
    household: {
      address: '435 Montford Ave, Asheville, NC 28801',
      memberCount: 1, adultCount: 1, childCount: 0,
      languagesSpoken: ['en'],
      status: 'active', profileComplete: false,
    },
  },
  {
    email: 'nguyen@readyblock.demo',
    password: 'REDACTED_PASSWORD',
    displayName: 'Mai Nguyen',
    role: 'householdMember',
    household: {
      address: '418 Oak St, Asheville, NC 28801',
      memberCount: 3, adultCount: 2, childCount: 1,
      petType: 'Fish', petCount: 5,
      languagesSpoken: ['vi', 'en'],
      status: 'active', profileComplete: true,
      hasVulnerableMembers: true,
      evacuationStatus: 'safe',
    },
    sensitive: {
      mobilityLimitation: true,
      checkOnMeFirst: true,
      sharingScope: 'coordinatorAndNeighbors',
    },
    skills: [
      { category: 'medical', level: 'certified', equipment: ['medical bag'] },
    ],
  },
  {
    email: 'garcia@readyblock.demo',
    password: 'REDACTED_PASSWORD',
    displayName: 'Carlos Garcia',
    role: 'householdMember',
    household: {
      address: '440 Montford Ave, Asheville, NC 28801',
      memberCount: 6, adultCount: 3, childCount: 3,
      languagesSpoken: ['es', 'en'],
      status: 'active', profileComplete: true,
      evacuationStatus: 'needCheckIn',
    },
    resources: [
      { type: 'power', name: 'Portable solar panel', quantity: 1, condition: 'good', shareable: true, location: 'home', requiresTraining: false },
    ],
  },
  {
    email: 'brown@readyblock.demo',
    password: 'REDACTED_PASSWORD',
    displayName: 'Angela Brown',
    role: 'householdMember',
    household: {
      address: '445 Montford Ave, Asheville, NC 28801',
      memberCount: 2, adultCount: 2, childCount: 0,
      languagesSpoken: ['en', 'fr'],
      status: 'active', profileComplete: true,
    },
    skills: [
      { category: 'counseling', level: 'certified', equipment: [] },
      { category: 'language', level: 'certified', languageSkill: 'French' },
    ],
  },
  {
    email: 'kim@readyblock.demo',
    password: 'REDACTED_PASSWORD',
    displayName: 'Soo-Jin Kim',
    role: 'householdMember',
    household: {
      address: '450 Montford Ave, Asheville, NC 28801',
      memberCount: 4, adultCount: 2, childCount: 2,
      petType: 'Dog', petCount: 1,
      languagesSpoken: ['ko', 'en'],
      status: 'active', profileComplete: true,
    },
  },
  // Unregistered / incomplete households
  {
    email: 'davis@readyblock.demo',
    password: 'REDACTED_PASSWORD',
    displayName: 'Robert Davis',
    role: 'householdMember',
    household: {
      address: '460 Montford Ave, Asheville, NC 28801',
      memberCount: 1, adultCount: 1, childCount: 0,
      status: 'active', profileComplete: false,
    },
  },
  {
    email: 'thompson@readyblock.demo',
    password: 'REDACTED_PASSWORD',
    displayName: 'Linda Thompson',
    role: 'unverified',
    household: {
      address: '465 Montford Ave, Asheville, NC 28801',
      memberCount: 2, adultCount: 2, childCount: 0,
      status: 'active', profileComplete: false,
    },
  },
];

async function seed() {
  console.log('Seeding ReadyBlock demo data...\n');

  // 1. Create neighborhood
  console.log('Creating neighborhood:', NEIGHBORHOOD.name);
  await db.collection('neighborhoods').doc(NEIGHBORHOOD_ID).set(NEIGHBORHOOD);

  // 2. Create users and households
  for (const user of DEMO_USERS) {
    console.log(`Creating user: ${user.displayName} (${user.role})`);

    // Create Firebase Auth user
    let uid;
    try {
      const userRecord = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
      });
      uid = userRecord.uid;
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        const existing = await auth.getUserByEmail(user.email);
        uid = existing.uid;
      } else {
        console.error(`  Error creating ${user.email}:`, err.message);
        continue;
      }
    }

    // Set captain UID for neighborhood
    if (user.role === 'blockCaptain') {
      await db.collection('neighborhoods').doc(NEIGHBORHOOD_ID).update({ captainUid: uid });
    }

    // Create user document
    await db.collection('users').doc(uid).set({
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      neighborhoodId: user.role !== 'cityCountyCaptain' ? NEIGHBORHOOD_ID : null,
      cityId: CITY_ID,
      createdAt: FieldValue.serverTimestamp(),
      lastLoginAt: FieldValue.serverTimestamp(),
      language: 'en',
      darkMode: 'system',
    });

    // Create household
    if (user.household) {
      const lat = 35.595 + Math.random() * 0.01;
      const lng = -82.560 + Math.random() * 0.015;

      await db.collection('households').doc(uid).set({
        ...user.household,
        neighborhoodId: NEIGHBORHOOD_ID,
        cityId: CITY_ID,
        lat,
        lng,
        assignmentStatus: 'assigned',
        assignedAt: FieldValue.serverTimestamp(),
        enteredBy: uid,
        isCoordinatorEntered: false,
        createdAt: FieldValue.serverTimestamp(),
        lastModified: FieldValue.serverTimestamp(),
        lastModifiedBy: uid,
      });

      // Add to neighborhood members
      await db.collection('neighborhoods').doc(NEIGHBORHOOD_ID).collection('members').doc(uid).set({
        uid,
        role: user.role,
        householdId: uid,
        joinedAt: FieldValue.serverTimestamp(),
      });
    }

    // Create sensitive data
    if (user.sensitive) {
      await db.collection('households').doc(uid).collection('sensitive').doc(uid).set({
        ...user.sensitive,
        consentTimestamp: FieldValue.serverTimestamp(),
        consentVersion: '1.0',
        lastModified: FieldValue.serverTimestamp(),
        lastModifiedBy: uid,
      });
    }

    // Create resources
    if (user.resources) {
      for (const resource of user.resources) {
        await db.collection('resources').add({
          ...resource,
          householdId: uid,
          neighborhoodId: NEIGHBORHOOD_ID,
          lastVerified: FieldValue.serverTimestamp(),
          lastVerifiedBy: uid,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    }

    // Create skills
    if (user.skills) {
      for (const skill of user.skills) {
        await db.collection('skills').add({
          ...skill,
          uid,
          householdId: uid,
          neighborhoodId: NEIGHBORHOOD_ID,
          withdrawnAt: null,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    }
  }

  // 3. Create a demo invite code
  await db.collection('inviteCodes').add({
    code: 'CAPTAIN2024',
    role: 'blockCaptain',
    neighborhoodId: NEIGHBORHOOD_ID,
    redeemed: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  // 4. Create a sample protocol
  await db.collection('protocols').add({
    title: 'Power Outage Response Plan',
    scenarioType: 'powerOutage',
    scope: 'neighborhood',
    neighborhoodId: NEIGHBORHOOD_ID,
    content: '<h2>Power Outage Response</h2><p>When power goes out for more than 2 hours:</p><ol><li>Check on vulnerable neighbors first</li><li>Pool generator resources at the rally point</li><li>Charge essential devices at shared stations</li><li>Share perishable food before it spoils</li></ol><p><strong>Rally Point:</strong> Montford Park pavilion</p>',
    version: 1,
    authorUid: 'system',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await db.collection('protocols').add({
    title: 'Flood Evacuation Plan',
    scenarioType: 'flood',
    scope: 'neighborhood',
    neighborhoodId: NEIGHBORHOOD_ID,
    content: '<h2>Flood Evacuation</h2><p>If water levels rise above street level:</p><ol><li>Move to upper floors immediately</li><li>Do NOT walk through floodwater</li><li>Coordinators check welfare list in priority order</li><li>Evacuate to backup rally point if primary is flooded</li></ol>',
    version: 1,
    authorUid: 'system',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log('\nSeed complete!');
  console.log('\nDemo accounts:');
  console.log('  Captain:  captain@readyblock.demo / REDACTED_PASSWORD');
  console.log('  Admin:    admin@readyblock.demo / REDACTED_PASSWORD');
  console.log('  Resident: martinez@readyblock.demo / REDACTED_PASSWORD');
  console.log('\nAll demo passwords: REDACTED_PASSWORD');
}

seed().catch(console.error);
