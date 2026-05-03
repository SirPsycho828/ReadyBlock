/**
 * Seed Asheville neighborhoods into Firestore via REST API.
 * Uses Firebase CLI token for authentication.
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'readyblock-hatch';
const CITY_ID = 'asheville-nc';

function getToken() {
  // Get access token from gcloud or firebase
  try {
    const token = execSync('gcloud auth print-access-token 2>/dev/null', { encoding: 'utf8' }).trim();
    if (token && !token.includes('ERROR')) return token;
  } catch {}

  // Try firebase token
  try {
    const token = execSync('firebase login:ci --no-localhost 2>/dev/null', { encoding: 'utf8' }).trim();
    if (token) return token;
  } catch {}

  throw new Error('No auth token available. Run: gcloud auth login or firebase login');
}

async function createDoc(token, collection, docId, data) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;

  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        fields[key] = { integerValue: String(value) };
      } else {
        fields[key] = { doubleValue: value };
      }
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map((item) => {
            if (typeof item === 'object' && item.lat !== undefined) {
              return {
                mapValue: {
                  fields: {
                    lat: { doubleValue: item.lat },
                    lng: { doubleValue: item.lng },
                  },
                },
              };
            }
            return { stringValue: String(item) };
          }),
        },
      };
    } else if (value === null) {
      fields[key] = { nullValue: null };
    }
  }

  const body = JSON.stringify({ fields });

  const resp = await fetch(url + '?updateMask.fieldPaths=' + Object.keys(data).join('&updateMask.fieldPaths='), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Firestore write failed for ${docId}: ${resp.status} ${err}`);
  }
}

async function seed() {
  console.log('Getting auth token...');
  const token = getToken();
  console.log('Token acquired.\n');

  const raw = readFileSync(join(__dirname, 'asheville-neighborhoods.geojson'), 'utf8');
  const geojson = JSON.parse(raw);
  console.log(`Found ${geojson.features.length} neighborhoods\n`);

  let created = 0;
  let failed = 0;

  for (const feature of geojson.features) {
    const name = (feature.properties.name || '').trim();
    if (!name) continue;

    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const coords = feature.geometry.coordinates[0];
    const boundary = coords.map(([lng, lat]) => ({ lat, lng }));
    const centroidLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
    const centroidLng = coords.reduce((s, c) => s + c[0], 0) / coords.length;

    try {
      await createDoc(token, 'neighborhoods', id, {
        name,
        cityId: CITY_ID,
        boundary,
        centroidLat,
        centroidLng,
        emergencyMode: false,
        preparednessScore: 0,
        householdCount: 0,
        registeredCount: 0,
      });
      console.log(`  ✓ ${name} (${id})`);
      created++;
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone! Created: ${created}, Failed: ${failed}`);
}

seed().catch(console.error);
