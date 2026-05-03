/**
 * Seed Asheville neighborhoods into Firestore from GIS data.
 *
 * Usage:
 *   Set GOOGLE_APPLICATION_CREDENTIALS or use Firebase emulator, then:
 *   node scripts/seed-neighborhoods.js
 *
 *   Or use firebase-admin with default credentials:
 *   GOOGLE_CLOUD_PROJECT=readyblock-hatch node scripts/seed-neighborhoods.js
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = initializeApp({
  credential: applicationDefault(),
  projectId: 'readyblock-hatch',
});
const db = getFirestore();

const CITY_ID = 'asheville-nc';

async function seed() {
  // Load GeoJSON
  const raw = readFileSync(join(__dirname, 'asheville-neighborhoods.geojson'), 'utf8');
  const geojson = JSON.parse(raw);

  console.log(`Found ${geojson.features.length} neighborhoods\n`);

  // Ensure city doc exists
  await db.collection('cities').doc(CITY_ID).set({
    name: 'Asheville',
    state: 'NC',
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  let created = 0;
  let skipped = 0;

  for (const feature of geojson.features) {
    const name = (feature.properties.name || '').trim();
    if (!name) {
      skipped++;
      continue;
    }

    // Create a URL-friendly ID
    const id = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Convert GeoJSON coordinates to our boundary format
    // GeoJSON is [lng, lat], we store as { lat, lng }
    const coords = feature.geometry.coordinates[0]; // outer ring
    const boundary = coords.map(([lng, lat]) => ({ lat, lng }));

    // Compute centroid for display
    const centroidLat = boundary.reduce((s, p) => s + p.lat, 0) / boundary.length;
    const centroidLng = boundary.reduce((s, p) => s + p.lng, 0) / boundary.length;

    const docData = {
      name,
      cityId: CITY_ID,
      boundary,
      centroidLat,
      centroidLng,
      emergencyMode: false,
      preparednessScore: 0,
      householdCount: 0,
      registeredCount: 0,
      narrativeStatus: feature.properties.narrative || 'Unknown',
      organizationName: feature.properties.nameoforganization || '',
      label: feature.properties.label || name,
      createdAt: FieldValue.serverTimestamp(),
    };

    await db.collection('neighborhoods').doc(id).set(docData, { merge: true });
    console.log(`  ✓ ${name} (${id}) — ${boundary.length} boundary points`);
    created++;
  }

  console.log(`\nDone! Created ${created} neighborhoods, skipped ${skipped}`);
  console.log(`City: ${CITY_ID}`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
