import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'public', 'images', 'restaurants');
const DATA_FILE = path.join(ROOT, 'src', 'data', 'restaurants.ts');
const KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_BASE = 'https://places.googleapis.com/v1';

if (!KEY) { console.error('ERROR: Set GOOGLE_PLACES_API_KEY'); process.exit(1); }

const RESTAURANTS = [
  { slug: 'brother-marcus-angel',        name: 'Brother Marcus',       postcode: 'N1 8EA' },
  { slug: 'gallipoli-islington',         name: 'Gallipoli Restaurant', postcode: 'N1 1QP' },
  { slug: 'omnom-islington',             name: 'OMNOM',                postcode: 'N1 1QP' },
  { slug: 'jam-delish-islington',        name: 'Jam Delish',           postcode: 'N1 0XT' },
  { slug: 'tanakatsu-clerkenwell',       name: 'TANAKATSU',            postcode: 'EC1V 7LT' },
  { slug: 'liman-islington',             name: 'Liman Restaurant',     postcode: 'N1 9PZ' },
  { slug: 'kipferl-islington',           name: 'Kipferl',              postcode: 'N1 8ED' },
  { slug: 'la-divina-islington',         name: 'La Divina',            postcode: 'N1 1QP' },
  { slug: 'fish-central-clerkenwell',    name: 'Fish Central',         postcode: 'EC1V 8AP' },
  { slug: 'oriental-gourmet-holloway',   name: 'Oriental Gourmet',     postcode: 'N7 8LT' },
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function textSearch(query) {
  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.photos',
      'Referer': 'https://kidfriendlylondon.co.uk/',
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  });
  const json = await res.json();
  if (json.error) { console.error('API error:', json.error.message); return null; }
  if (!json.places?.length) return null;
  return json.places[0];
}

async function downloadPhoto(photoName, destPath) {
  const url = `${PLACES_BASE}/${photoName}/media?maxWidthPx=1200&key=${KEY}&skipHttpRedirect=false`;
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'Referer': 'https://kidfriendlylondon.co.uk/' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buf));
}

const results = {};

for (const r of RESTAURANTS) {
  const idx = RESTAURANTS.indexOf(r) + 1;
  process.stdout.write(`[${idx}/10] ${r.name} (${r.postcode}) ... `);
  try {
    const place = await textSearch(`${r.name} ${r.postcode} London`);
    if (!place) { console.log('❌ not found'); results[r.slug] = []; await sleep(300); continue; }
    const photos = place.photos ?? [];
    if (!photos.length) { console.log(`⚠️  no photos for "${place.displayName?.text}"`); results[r.slug] = []; await sleep(300); continue; }
    const localPaths = [];
    for (let i = 0; i < Math.min(photos.length, 3); i++) {
      const filename = `${r.slug}-${i + 1}.jpg`;
      const destPath = path.join(IMAGES_DIR, filename);
      await downloadPhoto(photos[i].name, destPath);
      localPaths.push(`/images/restaurants/${filename}`);
      await sleep(150);
    }
    results[r.slug] = localPaths;
    console.log(`✅ ${localPaths.length} photo(s) — "${place.displayName?.text}"`);
  } catch (err) {
    console.log(`❌ error: ${err.message}`);
    results[r.slug] = [];
  }
  await sleep(400);
}

// Patch restaurants.ts
let src = fs.readFileSync(DATA_FILE, 'utf8');
let patched = 0;
for (const [slug, paths] of Object.entries(results)) {
  if (!paths.length) continue;
  const photosArray = paths.map(p => `"${p}"`).join(', ');
  const replacement = `    photos: [${photosArray}]`;
  const slugMarker = `slug: "${slug}"`;
  const slugIdx = src.indexOf(slugMarker);
  if (slugIdx === -1) { console.warn(`  ⚠️  slug not found: ${slug}`); continue; }
  const afterSlug = src.indexOf('\n', slugIdx);
  const photosIdx = src.indexOf('    photos: [', afterSlug);
  const photosEnd = src.indexOf(']', photosIdx) + 1;
  if (photosIdx === -1 || photosEnd === 0) { console.warn(`  ⚠️  photos not found: ${slug}`); continue; }
  src = src.slice(0, photosIdx) + replacement + src.slice(photosEnd);
  patched++;
  console.log(`  ✅ patched ${slug}`);
}
fs.writeFileSync(DATA_FILE, src, 'utf8');
console.log(`\nDone. ${patched}/10 restaurants updated.`);
