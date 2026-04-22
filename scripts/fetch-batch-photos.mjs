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
  { slug: 'terra-rossa-islington', name: 'Terra Rossa', postcode: 'N1 1QP' },
  { slug: 're-1996-islington', name: 'RE:1996', postcode: 'N1 1QN' },
  { slug: 'mangia-bene-islington', name: 'Mangia Bene', postcode: 'N1 9EZ' },
  { slug: 'santa-maria-pizzeria-islington', name: 'Santa Maria Pizzeria', postcode: 'N1 1RQ' },
  { slug: 'la-petite-auberge-islington', name: 'La Petite Auberge', postcode: 'N1 2TZ' },
  { slug: 'mr-lobo-islington', name: 'Mr LoBo', postcode: 'N1 1RG' },
  { slug: 'morr-islington', name: 'Morr', postcode: 'N1 1RU' },
  { slug: 'noci-islington', name: 'Noci Islington', postcode: 'N1 2XA' },
  { slug: 'bellanger-islington', name: 'Bellanger', postcode: 'N1 2XH' },
  { slug: 'the-blue-legume-islington', name: 'The Blue Legume', postcode: 'N1 1RG' },
  { slug: 'double-knot-islington', name: 'Double Knot Islington', postcode: 'N1 8BW' },
  { slug: 'megans-at-the-sorting-office-islington', name: "Megan's Islington Square", postcode: 'N1 1WL' },
  { slug: 'the-grill-club-islington', name: 'The Grill Club', postcode: 'N1 1RU' },
  { slug: 'hong-kong-restaurant-islington', name: 'Hong Kong Restaurant', postcode: 'N1 2TU' },
  { slug: 'pera-schnitzel-garden-islington', name: 'Pera Schnitzel Garden', postcode: 'N1 1RG' },
  { slug: 'galata-restaurant-bistro-islington', name: 'Galata Restaurant', postcode: 'N1 8PZ' },
  { slug: 'little-georgia-islington', name: 'Little Georgia', postcode: 'N1 0HB' },
  { slug: 'bobo-wild-shoreditch-islington', name: 'BOBO & WILD', postcode: 'N1 5EB' },
  { slug: 'humble-grape-islington-wine-bar-restaurant', name: 'Humble Grape Islington', postcode: 'N1 0QY' },
  { slug: 'fig-tree-cafe-islington', name: 'Fig Tree Cafe', postcode: 'N1 2LJ' },
  { slug: 'cafe-sizzles-islington', name: 'Cafe Sizzles', postcode: 'N1 9EX' },
  { slug: 'nonos-kings-cross', name: 'Nonos', postcode: 'WC1H 9NT' },
  { slug: 'urban-social-islington', name: 'Urban Social Islington', postcode: 'N1 1RU' },
  { slug: 'yipin-china-islington', name: 'Yipin China', postcode: 'N1 0QD' },
  { slug: 'llerena-spanish-tapas-bar-restaurant-islington', name: 'Llerena', postcode: 'N1 1US' },
  { slug: 'george-iv-islington', name: 'George IV Islington', postcode: 'N1 0RJ' },
  { slug: 'sophe-s-bar-cafe-restaurant-islington', name: "Sophe's", postcode: 'N1 1EE' },
  { slug: 'dzo-viet-kitchen-islington', name: 'Dzo Viet Kitchen', postcode: 'N1 1US' },
  { slug: 'el-inca-plebeyo-restaurant-islington', name: 'El Inca Plebeyo', postcode: 'N1 8LY' },
  { slug: 'zia-lucia-holloway', name: 'Zia Lucia Islington', postcode: 'N7 8LX' },
  { slug: 'carmelas-pizzeria-islington', name: "Carmela's Pizzeria", postcode: 'N1 1RA' },
  { slug: 'hope-anchor-islington', name: 'Hope & Anchor Islington', postcode: 'N1 1RL' },
  { slug: 'tacos-mx-islington', name: 'Tacos Mx Islington', postcode: 'N1 4QU' },
  { slug: 'workers-cafe-islington', name: 'Workers Cafe', postcode: 'N1 1RG' },
  { slug: 'casa-fabrizi-islington', name: 'Casa Fabrizi', postcode: 'N1 9EZ' },
  { slug: 'mem-laz-brasserie-islington', name: 'Mem & Laz Brasserie', postcode: 'N1 0QX' },
  { slug: 'salut-restaurant-islington', name: 'Salut! Restaurant', postcode: 'N1 3PJ' },
  { slug: 'the-island-queen-islington', name: 'The Island Queen', postcode: 'N1 8HD' },
  { slug: 'islington-townhouse', name: 'Islington Townhouse', postcode: 'N1 0RW' },
  { slug: 'caf-millennium-islington', name: 'Café Millennium', postcode: 'N1 9EZ' },
  { slug: 'masigo-islington', name: 'Masigo', postcode: 'N1 9EN' },
  { slug: 'saponara-islington', name: 'Saponara', postcode: 'N1 8PF' },
  { slug: 'vertige-caf-islington', name: 'Vertige Café', postcode: 'N1 2UP' },
  { slug: 'plaquemine-lock-islington', name: 'Plaquemine Lock', postcode: 'N1 8LB' },
  { slug: 'the-italos-islington-italian-restaurant-pizzeria', name: "The Italo's Islington", postcode: 'EC1V 7LQ' },
  { slug: 'bistro-sabl-islington', name: 'Bistro Sablé', postcode: 'N1 2DG' },
  { slug: 'tootoomoo-islington', name: 'Tootoomoo Islington', postcode: 'N1 2LH' },
  { slug: 'indian-veg-islington', name: 'Indian Veg', postcode: 'N1 9EX' },
  { slug: 'rabieng-thai-restaurant-islington', name: 'Rabieng Thai Restaurant', postcode: 'N1 1QY' },
  { slug: 'franks-canteen-highbury', name: 'Franks Canteen', postcode: 'N5 2XE' },
  { slug: 'iberia-georgian-restaurant-islington', name: 'IBERIA Georgian Restaurant', postcode: 'N1 1BA' },
  { slug: 'pizza-pilgrims-exmouth-market-clerkenwell', name: 'Pizza Pilgrims Exmouth Market', postcode: 'EC1R 4QD' },
  { slug: 'zaffrani-islington', name: 'Zaffrani', postcode: 'N1 2BB' },
  { slug: 'cirrik-19-numara-bos-stoke-newington', name: 'Cirrik 19 Numara Bos', postcode: 'N16 7XJ' },
  { slug: 'wolkite-restaurant-holloway', name: 'Wolkite Restaurant', postcode: 'N7 7NN' },
  { slug: 'tenshi-islington', name: 'Tenshi', postcode: 'N1 0NY' },
  { slug: 'the-chapel-bar-islington', name: 'The Chapel Bar', postcode: 'N1 9PX' },
  { slug: 'angel-inn', name: 'Angel Inn', postcode: 'EC1V 4NJ' },
  { slug: 'marathon-restaurant-islington', name: 'Marathon Restaurant', postcode: 'N1 0SL' },
  { slug: 'buna-ethiopian-restaurant-holloway', name: 'Buna Ethiopian Restaurant', postcode: 'N7 8LT' },
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
  if (json.error) { console.error('  API error:', json.error.message); return null; }
  if (!json.places?.length) return null;
  return json.places[0];
}

async function downloadPhoto(photoName, destPath) {
  const url = `${PLACES_BASE}/${photoName}/media?maxWidthPx=1200&key=${KEY}&skipHttpRedirect=false`;
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'Referer': 'https://kidfriendlylondon.co.uk/' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buf));
}

const results = {};
const total = RESTAURANTS.length;

for (const r of RESTAURANTS) {
  const idx = RESTAURANTS.indexOf(r) + 1;
  process.stdout.write(`[${idx}/${total}] ${r.name} (${r.postcode}) ... `);
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
console.log('\nPatching src/data/restaurants.ts ...');
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
  if (photosIdx === -1 || photosEnd === 0) { console.warn(`  ⚠️  photos field not found: ${slug}`); continue; }
  src = src.slice(0, photosIdx) + replacement + src.slice(photosEnd);
  patched++;
}
fs.writeFileSync(DATA_FILE, src, 'utf8');
const found = Object.values(results).filter(p => p.length > 0).length;
const notFound = Object.values(results).filter(p => p.length === 0).length;
console.log(`\nDone. ${patched} restaurants patched with photos.`);
console.log(`Found: ${found}, Not found/no photos: ${notFound}`);
