/**
 * Fetch real Google Places photos for every restaurant listing.
 * Uses the Places API (New) — v1 endpoints.
 *
 * Usage:
 *   GOOGLE_PLACES_API_KEY=your_key node scripts/fetch-restaurant-photos.mjs
 *
 * What it does:
 *   1. Text Search each restaurant by name + postcode (new Places API)
 *   2. Downloads up to 3 photos per restaurant to public/images/restaurants/
 *   3. Patches src/data/restaurants.ts with the local /images/restaurants/... paths
 *
 * Requirements: Node 18+ (built-in fetch)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'public', 'images', 'restaurants');
const DATA_FILE = path.join(ROOT, 'src', 'data', 'restaurants.ts');

const KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!KEY) {
  console.error('ERROR: Set GOOGLE_PLACES_API_KEY environment variable.');
  process.exit(1);
}

fs.mkdirSync(IMAGES_DIR, { recursive: true });

// ─── Restaurant list ──────────────────────────────────────────────────────────
const RESTAURANTS = [
  // Clapham
  { slug: 'the-windmill-clapham',      name: 'The Windmill',               postcode: 'SW4 7JQ' },
  { slug: 'megan-s-clapham',           name: "Megan's",                    postcode: 'SW4 7AA' },
  { slug: 'honest-burgers-clapham',    name: 'Honest Burgers',             postcode: 'SW4 7UD' },
  { slug: 'naughty-piglets-brixton',   name: 'Naughty Piglets',            postcode: 'SW2 1QW' },
  { slug: 'bodeans-clapham',           name: "Bodean's BBQ",               postcode: 'SW4 7AE' },
  { slug: 'trinity-clapham',           name: 'Trinity Restaurant',         postcode: 'SW4 0JD' },
  { slug: 'the-manor-arms-clapham',    name: 'The Manor Arms',             postcode: 'SW4 9JH' },
  { slug: 'pizza-east-clapham',        name: 'Pizza East',                 postcode: 'SW4 7AA' },
  { slug: 'the-dairy-clapham',         name: 'The Dairy',                  postcode: 'SW4 7UD' },
  { slug: 'pausa-clapham',             name: 'Pausa',                      postcode: 'SW4 7ES' },
  // Notting Hill
  { slug: 'the-farmhouse-notting-hill',      name: 'Granger & Co',               postcode: 'W11 2EE' },
  { slug: 'ottolenghi-notting-hill',         name: 'Ottolenghi',                  postcode: 'W11 2ED' },
  { slug: 'fishs-eddy-notting-hill',         name: 'Granger and Co',              postcode: 'W11 2EE' },
  { slug: 'the-cow-notting-hill',            name: 'The Cow',                     postcode: 'W2 5BH' },
  { slug: 'e-mono-notting-hill',             name: 'E Mono',                      postcode: 'W10 5BZ' },
  { slug: 'lidgate-butcher-cafe-notting-hill', name: "C. Lidgate",               postcode: 'W11 2EA' },
  { slug: 'kitchen-w8-notting-hill',         name: 'Kitchen W8',                  postcode: 'W8 4PT' },
  { slug: 'beach-blanket-babylon-notting-hill', name: 'Beach Blanket Babylon',   postcode: 'W11 1NP' },
  { slug: 'lowiczanka-notting-hill',         name: 'Lowiczanka',                  postcode: 'W6 8RD' },
  { slug: 'lucky-seven-notting-hill',        name: 'Lucky Seven',                 postcode: 'W2 5BD' },
  // Islington
  { slug: 'ottolenghi-islington',            name: 'Ottolenghi',                  postcode: 'N1 1QE' },
  { slug: 'trullo-islington',                name: 'Trullo',                      postcode: 'N1 1RA' },
  { slug: 'the-elk-in-the-woods-islington',  name: 'The Elk in the Woods',        postcode: 'N1 8EG' },
  { slug: 'the-charles-lamb-islington',      name: 'The Charles Lamb',            postcode: 'N1 8EG' },
  { slug: 'gem-islington',                   name: 'Gem',                         postcode: 'N1 1NB' },
  { slug: 'fredericks-islington',            name: "Frederick's",                 postcode: 'N1 8QX' },
  { slug: 'the-breakfast-club-islington',    name: 'The Breakfast Club',          postcode: 'N1 8EG' },
  { slug: 'the-almeida-islington',           name: 'The Almeida',                 postcode: 'N1 1TA' },
  { slug: 'greenberry-islington',            name: 'Greenberry Cafe',             postcode: 'NW1 8AJ' },
  { slug: 'the-drapers-arms-islington',      name: 'The Drapers Arms',            postcode: 'N1 2UA' },
  // Richmond
  { slug: 'the-dysart-richmond',             name: 'The Dysart Petersham',        postcode: 'TW10 7AA' },
  { slug: 'the-white-cross-richmond',        name: 'The White Cross',             postcode: 'TW9 1TH' },
  { slug: 'chez-lindsay-richmond',           name: 'Chez Lindsay',                postcode: 'TW10 6RW' },
  { slug: 'the-richmond-restaurant',         name: 'Petersham Nurseries',         postcode: 'TW10 7AG' },
  { slug: 'gaucho-richmond',                 name: 'Gaucho Richmond',             postcode: 'TW9 1TH' },
  { slug: 'the-princes-head-richmond',       name: 'The Princes Head',            postcode: 'TW9 1SX' },
  { slug: 'brula-richmond',                  name: 'Brula',                       postcode: 'TW1 1RG' },
  { slug: 'la-buvette-richmond',             name: 'La Buvette',                  postcode: 'TW9 1LB' },
  { slug: 'the-terrace-richmond-park',       name: 'The Terrace Richmond Park',   postcode: 'TW10 5HS' },
  { slug: 'petersham-hotel-restaurant-richmond', name: 'Petersham Hotel',         postcode: 'TW10 6UX' },
  // Shoreditch
  { slug: 'padella-shoreditch',              name: 'Padella',                     postcode: 'E1 6RF' },
  { slug: 'smoking-goat-shoreditch',         name: 'Smoking Goat',                postcode: 'E1 6RF' },
  { slug: 'dishoom-shoreditch',              name: 'Dishoom',                     postcode: 'E1 6RF' },
  { slug: 'brat-shoreditch',                 name: 'Brat',                        postcode: 'E1 6QL' },
  { slug: 'boxpark-shoreditch',              name: 'Boxpark Shoreditch',           postcode: 'E1 6GY' },
  { slug: 'cafe-columbia-shoreditch',        name: 'Cafe Columbia',               postcode: 'E2 7RG' },
  { slug: 'lyles-shoreditch',                name: "Lyle's",                      postcode: 'E1 6RF' },
  { slug: 'mother-chicken-shoreditch',       name: 'Mother Chicken',              postcode: 'E2 7RG' },
  { slug: 'galvin-la-chapelle-shoreditch',   name: 'Galvin La Chapelle',          postcode: 'E1 7LD' },
  { slug: 'corner-room-shoreditch',          name: 'The Corner Room',             postcode: 'E2 9NF' },
];

// ─── Places API (New) helpers ─────────────────────────────────────────────────

const PLACES_BASE = 'https://places.googleapis.com/v1';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function textSearch(query) {
  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.photos',
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  });
  const json = await res.json();
  if (!json.places?.length) return null;
  return json.places[0];
}

async function downloadPhoto(photoName, destPath) {
  // New Places API photo URL — follows redirect to actual image
  const url = `${PLACES_BASE}/${photoName}/media?maxWidthPx=1200&key=${KEY}&skipHttpRedirect=false`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${photoName}`);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buf));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const results = {}; // slug → ['/images/restaurants/...']

for (const r of RESTAURANTS) {
  const idx = RESTAURANTS.indexOf(r) + 1;
  process.stdout.write(`[${idx}/50] ${r.name} (${r.postcode}) ... `);

  try {
    const place = await textSearch(`${r.name} ${r.postcode} London`);
    if (!place) {
      console.log('❌ not found');
      results[r.slug] = [];
      await sleep(300);
      continue;
    }

    const photos = place.photos ?? [];
    if (!photos.length) {
      console.log(`⚠️  found "${place.displayName?.text}" but no photos`);
      results[r.slug] = [];
      await sleep(300);
      continue;
    }

    const localPaths = [];
    const toDownload = photos.slice(0, 3);

    for (let i = 0; i < toDownload.length; i++) {
      const filename = `${r.slug}-${i + 1}.jpg`;
      const destPath = path.join(IMAGES_DIR, filename);
      await downloadPhoto(toDownload[i].name, destPath);
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

// ─── Patch restaurants.ts ─────────────────────────────────────────────────────
console.log('\nPatching src/data/restaurants.ts ...');

let src = fs.readFileSync(DATA_FILE, 'utf8');
let patched = 0;

for (const [slug, paths] of Object.entries(results)) {
  if (!paths.length) continue;

  const photosArray = paths.map((p) => `"${p}"`).join(', ');
  const replacement = `    photos: [${photosArray}]`;

  const slugMarker = `slug: "${slug}"`;
  const slugIdx = src.indexOf(slugMarker);
  if (slugIdx === -1) { console.warn(`  ⚠️  slug not found: ${slug}`); continue; }

  const afterSlug = src.indexOf('\n', slugIdx);
  const photosIdx = src.indexOf('    photos: [', afterSlug);
  const photosEnd = src.indexOf(']', photosIdx) + 1;
  if (photosIdx === -1 || photosEnd === 0) { console.warn(`  ⚠️  photos field not found: ${slug}`); continue; }

  src = src.slice(0, photosIdx) + replacement + src.slice(photosEnd);
  patched++;
  console.log(`  ✅ ${slug} (${paths.length} photos)`);
}

fs.writeFileSync(DATA_FILE, src, 'utf8');
console.log(`\nDone. ${patched}/${RESTAURANTS.length} restaurants updated.`);
