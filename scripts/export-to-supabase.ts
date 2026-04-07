/**
 * Export restaurants data to Supabase
 * Run: npx tsx scripts/export-to-supabase.ts
 *
 * Set env vars first:
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY=your-service-role-key
 */

import { createClient } from '@supabase/supabase-js';
import { restaurants } from '../src/data/restaurants.js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  console.log(`Exporting ${restaurants.length} restaurants to Supabase...`);

  const rows = restaurants.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    neighbourhood: r.neighbourhood,
    borough: r.borough,
    address: r.address,
    postcode: r.postcode,
    phone: r.phone ?? null,
    website: r.website ?? null,
    cuisine_type: r.cuisineType,
    price_range: r.priceRange,
    google_rating: r.googleRating,
    review_count: r.reviewCount,
    opening_hours: r.openingHours,
    lat: r.lat ?? null,
    lng: r.lng ?? null,
    kids_menu: r.kidsMenu,
    highchairs: r.highchairs,
    outdoor_space: r.outdoorSpace,
    soft_play: r.softPlay,
    baby_changing: r.babyChanging,
    buggy_accessible: r.buggyAccessible,
    noise_level: r.noiseLevel,
    best_for_age_range: r.bestForAgeRange,
    booking_required: r.bookingRequired,
    description: r.description,
    short_description: r.shortDescription,
    photos: r.photos,
    tags: r.tags,
    featured: r.featured,
    opentable_id: r.openTableId ?? null,
    published: true,
  }));

  const { error } = await supabase
    .from('restaurants')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`✅ Exported ${rows.length} restaurants successfully`);
}

run();
