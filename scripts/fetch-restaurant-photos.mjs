/**
 * Fetch real Google Places photos for every restaurant listing.
 *
 * Usage:
 *   GOOGLE_PLACES_API_KEY=your_key node scripts/fetch-restaurant-photos.mjs
 *
 * What it does:
 *   1. Searches Google Places for each restaurant by name + postcode
 *   2. Downloads up to 3 photos per restaurant to public/images/restaurants/
 *   3. Updates src/data/restaurants.ts with the local /images/restaurants/... paths
 *
 * Requirements: Node 18+ (uses built-in fetch + fs/promises)
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
  console.error('  GOOGLE_PLACES_API_KEY=your_key node scripts/fetch-restaurant-photos.mjs');
  process.exit(1);
}

fs.mkdirSync(IMAGES_DIR, { recursive: true });

// ─── Restaurant list ──────────────────────────────────────────────────────────
// slug, name, postcode — enough for a precise Places Text Search
const RESTAURANTS = [
  // Clapham
  { slug: 'the-windmill-clapham',      name: 'The Windmill Clapham',        postcode: 'SW4 7JQ' },
  { slug: 'megan-s-clapham',           name: "Megan's Clapham",             postcode: 'SW4 7AA' },
  { slug: 'honest-burgers-clapham',    name: 'Honest Burgers Clapham',      postcode: 'SW4 7UD' },
  { slug: 'naughty-piglets-brixton',   name: 'Naughty Piglets Brixton',     postcode: 'SW2 1QW' },
  { slug: 'bodeans-clapham',           name: "Bodean's BBQ Clapham",        postcode: 'SW4 7AE' },
  { slug: 'trinity-clapham',           name: 'Trinity Restaurant Clapham',  postcode: 'SW4 0JD' },
  { slug: 'the-manor-arms-clapham',    name: 'The Manor Arms Clapham',      postcode: 'SW4 9JH' },
  { slug: 'pizza-east-clapham',        name: 'Pizza East Clapham',          postcode: 'SW4 7AA' },
  { slug: 'the-dairy-clapham',         name: 'The Dairy Clapham',           postcode: 'SW4 7UD' },
  { slug: 'pausa-clapham',             name: 'Pausa Clapham',               postcode: 'SW4 7ES' },
  // Notting Hill
  { slug: 'the-farmhouse-notting-hill',      name: 'The Farmhouse Notting Hill',         postcode: 'W11 1LJ' },
  { slug: 'ottolenghi-notting-hill',         name: 'Ottolenghi Notting Hill',             postcode: 'W11 2ED' },
  { slug: 'fishs-eddy-notting-hill',         name: "Granger & Co Notting Hill",           postcode: 'W11 2EE' },
  { slug: 'the-cow-notting-hill',            name: 'The Cow Notting Hill',                postcode: 'W2 5BH' },
  { slug: 'e-mono-notting-hill',             name: 'E Mono Notting Hill',                 postcode: 'W10 5BZ' },
  { slug: 'lidgate-butcher-cafe-notting-hill', name: 'Lidgate Butcher Notting Hill',    postcode: 'W11 2EA' },
  { slug: 'kitchen-w8-notting-hill',         name: 'Kitchen W8 Notting Hill',             postcode: 'W8 4PT' },
  { slug: 'beach-blanket-babylon-notting-hill', name: 'Beach Blanket Babylon Notting Hill', postcode: 'W11 1NP' },
  { slug: 'lowiczanka-notting-hill',         name: 'Lowiczanka Polish Cultural Centre',   postcode: 'W6 8RD' },
  { slug: 'lucky-seven-notting-hill',        name: 'Lucky Seven American Diner London',   postcode: 'W2 5BD' },
  // Islington
  { slug: 'ottolenghi-islington',            name: 'Ottolenghi Islington',                postcode: 'N1 1QE' },
  { slug: 'trullo-islington',                name: 'Trullo Islington',                    postcode: 'N1 1RA' },
  { slug: 'the-elk-in-the-woods-islington',  name: 'The Elk in the Woods Islington',      postcode: 'N1 8EG' },
  { slug: 'the-charles-lamb-islington',      name: 'The Charles Lamb Islington',          postcode: 'N1 8EG' },
  { slug: 'gem-islington',                   name: 'Gem Restaurant Islington',            postcode: 'N1 1NB' },
  { slug: 'fredericks-islington',            name: "Frederick's Restaurant Islington",    postcode: 'N1 8QX' },
  { slug: 'the-breakfast-club-islington',    name: 'The Breakfast Club Islington',        postcode: 'N1 8EG' },
  { slug: 'the-almeida-islington',           name: 'The Almeida Restaurant Islington',    postcode: 'N1 1TA' },
  { slug: 'greenberry-islington',            name: 'Greenberry Cafe Primrose Hill',       postcode: 'NW1 8AJ' },
  { slug: 'the-drapers-arms-islington',      name: 'The Drapers Arms Islington',          postcode: 'N1 2UA' },
  // Richmond
  { slug: 'the-dysart-richmond',             name: 'The Dysart Petersham Richmond',       postcode: 'TW10 7AA' },
  { slug: 'the-white-cross-richmond',        name: 'The White Cross Richmond',            postcode: 'TW9 1TH' },
  { slug: 'chez-lindsay-richmond',           name: 'Chez Lindsay Richmond',               postcode: 'TW10 6RW' },
  { slug: 'the-richmond-restaurant',         name: 'Petersham Nurseries Richmond',        postcode: 'TW10 7AG' },
  { slug: 'gaucho-richmond',                 name: 'Gaucho Richmond',                     postcode: 'TW9 1TH' },
  { slug: 'the-princes-head-richmond',       name: 'The Princes Head Richmond',           postcode: 'TW9 1SX' },
  { slug: 'brula-richmond',                  name: 'Brula Bistrot St Margarets',          postcode: 'TW1 1RG' },
  { slug: 'la-buvette-richmond',             name: 'La Buvette Richmond',                 postcode: 'TW9 1LB' },
  { slug: 'the-terrace-richmond-park',       name: 'The Terrace Richmond Park',           postcode: 'TW10 5HS' },
  { slug: 'petersham-hotel-restaurant-richmond', name: 'Petersham Hotel Restaurant',      postcode: 'TW10 6UX' },
  // Shoreditch
  { slug: 'padella-shoreditch',              name: 'Padella Shoreditch',                  postcode: 'E1 6RF' },
  { slug: 'smoking-goat-shoreditch',         name: 'Smoking Goat Shoreditch',             postcode: 'E1 6RF' },
  { slug: 'dishoom-shoreditch',              name: 'Dishoom Shoreditch',                  postcode: 'E1 6RF' },
  { slug: 'brat-shoreditch',                 name: 'Brat Restaurant Shoreditch',          postcode: 'E1 6QL' },
  { slug: 'boxpark-shoreditch',              name: 'Boxpark Shoreditch',                  postcode: 'E1 6GY' },
  { slug: 'cafe-columbia-shoreditch',        name: 'Cafe Columbia Shoreditch',            postcode: 'E2 7RG' },
  { slug: 'lyles-shoreditch',                name: "Lyle's Shoreditch",                   postcode: 'E1 6RF' },
  { slug: 'mother-chicken-shoreditch',       name: 'Mother Chicken Shoreditch',           postcode: 'E2 7RG' },
  { slug: 'galvin-la-chapelle-shoreditch',   name: 'Galvin La Chapelle',                  postcode: 'E1 7LD' },
  { slug: 'corner-room-shoreditch',          name: 'The Corner Room Town Hall Hotel',     postcode: 'E2 9NF' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function textSearch(query) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status !== 'OK') return null;
  return json.results[0];
}

async function placeDetails(placeId) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  return json.result?.photos ?? [];
}

async function downloadPhoto(photoRef, destPath) {
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photoreference=${photoRef}&key=${KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buf));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const results = {}; // slug → ['/images/restaurants/...', ...]

for (const r of RESTAURANTS) {
  process.stdout.write(`[${RESTAURANTS.indexOf(r) + 1}/${RESTAURANTS.length}] ${r.name} ... `);

  try {
    const place = await textSearch(`${r.name} ${r.postcode} London`);
    if (!place) {
      console.log('❌ not found in Places');
      results[r.slug] = [];
      await sleep(200);
      continue;
    }

    const photos = await placeDetails(place.place_id);
    if (!photos.length) {
      console.log('⚠️  no photos');
      results[r.slug] = [];
      await sleep(200);
      continue;
    }

    const localPaths = [];
    const toDownload = photos.slice(0, 3);

    for (let i = 0; i < toDownload.length; i++) {
      const filename = `${r.slug}-${i + 1}.jpg`;
      const destPath = path.join(IMAGES_DIR, filename);
      await downloadPhoto(toDownload[i].photo_reference, destPath);
      localPaths.push(`/images/restaurants/${filename}`);
      await sleep(100);
    }

    results[r.slug] = localPaths;
    console.log(`✅ ${localPaths.length} photo(s)`);
  } catch (err) {
    console.log(`❌ error: ${err.message}`);
    results[r.slug] = [];
  }

  await sleep(300); // stay well within rate limits
}

// ─── Patch restaurants.ts ─────────────────────────────────────────────────────
console.log('\nPatching src/data/restaurants.ts ...');

let src = fs.readFileSync(DATA_FILE, 'utf8');
let patched = 0;

for (const [slug, paths] of Object.entries(results)) {
  if (!paths.length) continue;

  const photosArray = paths.map((p) => `"${p}"`).join(', ');
  const replacement = `photos: [${photosArray}]`;

  // Match "slug: "the-slug"" then find the next `photos: [...]` within the same object
  // We use a simple approach: find the slug declaration, then replace the next photos: [] after it
  const slugMarker = `slug: "${slug}"`;
  const slugIdx = src.indexOf(slugMarker);
  if (slugIdx === -1) {
    console.warn(`  ⚠️  slug not found: ${slug}`);
    continue;
  }

  // Find next photos: [...] after this slug
  const afterSlug = src.indexOf('\n', slugIdx);
  const photosIdx = src.indexOf('    photos: [', afterSlug);
  const photosEnd = src.indexOf(']', photosIdx) + 1;

  if (photosIdx === -1 || photosEnd === 0) {
    console.warn(`  ⚠️  photos field not found for: ${slug}`);
    continue;
  }

  src = src.slice(0, photosIdx) + `    ${replacement}` + src.slice(photosEnd);
  patched++;
  console.log(`  ✅ ${slug}`);
}

fs.writeFileSync(DATA_FILE, src, 'utf8');
console.log(`\nDone. ${patched} restaurants updated in restaurants.ts.`);
console.log('Next: npm run build && git add -A && git commit -m "Add Google Places photos" && git push');
