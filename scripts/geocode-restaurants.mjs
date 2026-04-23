/**
 * Geocode restaurants missing lat/lng using OpenStreetMap Nominatim API.
 * Free, no API key required. Respects 1 req/sec rate limit.
 *
 * Usage: node scripts/geocode-restaurants.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, '..', 'src', 'data', 'restaurants.ts');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function nominatim(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=gb`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'KidFriendlyLondon/1.0 (https://kidfriendlylondon.co.uk)' },
  });
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

async function geocode(address, postcode) {
  // Try full address first
  let coords = await nominatim(`${address} ${postcode} London UK`);
  if (coords) return coords;
  await sleep(1100);
  // Fallback: just postcode
  coords = await nominatim(`${postcode} London UK`);
  return coords;
}

let src = fs.readFileSync(DATA_FILE, 'utf8');

// Find restaurants without lat: by checking each slug's surrounding context
const slugPattern = /slug: "([^"]+)"/g;
const missing = [];
let m;
while ((m = slugPattern.exec(src)) !== null) {
  const slug = m.group ? m.group(1) : m[1];
  const start = m.index;
  const chunk = src.slice(start, start + 1200);
  if (!chunk.includes('    lat:')) {
    // Extract address and postcode
    const addrMatch = /address: "([^"]+)"/.exec(chunk);
    const pcMatch = /postcode: "([^"]+)"/.exec(chunk);
    if (addrMatch && pcMatch) {
      missing.push({ slug, address: addrMatch[1], postcode: pcMatch[1] });
    }
  }
}

console.log(`Found ${missing.length} restaurants missing coordinates`);

if (missing.length === 0) {
  console.log('All restaurants already have lat/lng. Nothing to do.');
  process.exit(0);
}

let patched = 0;
for (const r of missing) {
  process.stdout.write(`Geocoding: ${r.slug} (${r.address}, ${r.postcode}) ... `);
  const coords = await geocode(r.address, r.postcode);
  if (!coords) {
    console.log('❌ not found');
    await sleep(1100);
    continue;
  }
  console.log(`✅ ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);

  // Insert lat/lng after the postcode line for this slug
  const slugMarker = `slug: "${r.slug}"`;
  const slugIdx = src.indexOf(slugMarker);
  if (slugIdx === -1) { console.warn(`  ⚠️ slug not found in file`); continue; }

  const chunk = src.slice(slugIdx, slugIdx + 2000);
  const postcodeMatch = /postcode: "[^"]+",/.exec(chunk);
  if (!postcodeMatch) { console.warn(`  ⚠️ postcode line not found`); continue; }

  const insertAt = slugIdx + postcodeMatch.index + postcodeMatch[0].length;
  const insertion = `\n    lat: ${coords.lat},\n    lng: ${coords.lng},`;
  src = src.slice(0, insertAt) + insertion + src.slice(insertAt);

  patched++;
  await sleep(1100); // Nominatim: max 1 req/sec
}

fs.writeFileSync(DATA_FILE, src);
console.log(`\nDone. ${patched}/${missing.length} restaurants geocoded.`);
