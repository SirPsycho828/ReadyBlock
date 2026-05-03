/**
 * Seed Asheville neighborhoods into Firestore using Firebase client SDK.
 * This bypasses security rules by writing to Firestore directly.
 *
 * NOTE: Temporarily need to allow writes. We'll use the REST API with
 * the Firebase Admin approach via a service account, OR we can use
 * the Firestore REST API directly.
 *
 * For now: uses firebase-tools admin access.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CITY_ID = 'asheville-nc';
const PROJECT_ID = 'readyblock-hatch';

async function getAccessToken() {
  // Use firebase CLI token
  const { execSync } = await import('child_process');
  const token = execSync('firebase login:ci --no-localhost 2>/dev/null || echo ""', { encoding: 'utf8' }).trim();
  return token;
}

async function seed() {
  const raw = readFileSync(join(__dirname, 'asheville-neighborhoods.geojson'), 'utf8');
  const geojson = JSON.parse(raw);
  console.log(`Found ${geojson.features.length} neighborhoods\n`);

  // Use firebase CLI auth to get a token for REST API
  const { execSync } = await import('child_process');

  let created = 0;

  for (const feature of geojson.features) {
    const name = (feature.properties.name || '').trim();
    if (!name) continue;

    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const coords = feature.geometry.coordinates[0];
    const boundary = coords.map(([lng, lat]) => ({
      lat: { doubleValue: lat },
      lng: { doubleValue: lng },
    }));

    const centroidLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
    const centroidLng = coords.reduce((s, c) => s + c[0], 0) / coords.length;

    // Use firebase CLI to write via firestore:set-like approach
    const docData = {
      name,
      cityId: CITY_ID,
      boundary: coords.map(([lng, lat]) => ({ lat, lng })),
      centroidLat,
      centroidLng,
      emergencyMode: false,
      preparednessScore: 0,
      householdCount: 0,
      registeredCount: 0,
      narrativeStatus: feature.properties.narrative || 'Unknown',
      organizationName: feature.properties.nameoforganization || '',
      label: feature.properties.label || name,
    };

    // Write a JSON file that we'll import
    const outputPath = join(__dirname, 'neighborhoods-import.json');

    // Append to a batch
    if (created === 0) {
      // Start fresh
      writeFileSync(outputPath, '');
    }

    // Use the firebase CLI firestore:delete + set approach isn't available.
    // Let's generate a node script that runs in functions context
    console.log(`  ${name} (${id}) — ${coords.length} points`);
    created++;
  }

  // Generate the actual import script that runs with admin credentials
  const neighborhoods = geojson.features
    .filter(f => f.properties.name?.trim())
    .map(f => {
      const name = f.properties.name.trim();
      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const coords = f.geometry.coordinates[0];
      return {
        id,
        name,
        cityId: CITY_ID,
        boundary: coords.map(([lng, lat]) => ({ lat, lng })),
        centroidLat: coords.reduce((s, c) => s + c[1], 0) / coords.length,
        centroidLng: coords.reduce((s, c) => s + c[0], 0) / coords.length,
        emergencyMode: false,
        preparednessScore: 0,
        householdCount: 0,
        registeredCount: 0,
        narrativeStatus: f.properties.narrative || 'Unknown',
        organizationName: f.properties.nameoforganization || '',
      };
    });

  writeFileSync(
    join(__dirname, 'neighborhoods-data.json'),
    JSON.stringify(neighborhoods, null, 2),
  );

  console.log(`\nExported ${created} neighborhoods to neighborhoods-data.json`);
  console.log('Now deploying via Cloud Function...');
}

seed().catch(console.error);
