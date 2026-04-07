/**
 * Monthly new listing discovery
 * Queries Google Places API for new kid-friendly restaurants in priority neighbourhoods
 * Adds them to Supabase as pending_review = true (not published until reviewed)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY!;

const SEARCH_LOCATIONS = [
  { name: 'Clapham', lat: 51.4613, lng: -0.1388 },
  { name: 'Notting Hill', lat: 51.5132, lng: -0.2011 },
  { name: 'Islington', lat: 51.5362, lng: -0.1036 },
  { name: 'Richmond', lat: 51.4613, lng: -0.3012 },
  { name: 'Shoreditch', lat: 51.5232, lng: -0.0776 },
];

const SEARCH_RADIUS = 1000; // metres
const SEARCH_TYPE = 'restaurant';
const MIN_RATING = 4.0;
const MIN_REVIEWS = 50;

async function searchNearby(lat: number, lng: number): Promise<any[]> {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${SEARCH_RADIUS}&type=${SEARCH_TYPE}&key=${GOOGLE_KEY}`;
  const res = await fetch(url);
  const data = await res.json() as any;
  return data.results ?? [];
}

async function run() {
  console.log('Starting monthly discovery...');

  // Get existing IDs to avoid duplicates
  const { data: existing } = await supabase
    .from('restaurants')
    .select('id, name');
  const existingNames = new Set((existing ?? []).map((r: any) => r.name.toLowerCase()));

  let newCount = 0;

  for (const location of SEARCH_LOCATIONS) {
    console.log(`Searching in ${location.name}...`);
    const results = await searchNearby(location.lat, location.lng);

    const candidates = results.filter((p: any) =>
      p.rating >= MIN_RATING &&
      p.user_ratings_total >= MIN_REVIEWS &&
      !existingNames.has(p.name.toLowerCase())
    );

    console.log(`  Found ${candidates.length} new candidates in ${location.name}`);

    for (const place of candidates) {
      const slug = place.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + location.name.toLowerCase().replace(/\s+/g, '-');

      const row = {
        id: `pending-${place.place_id}`,
        slug,
        name: place.name,
        neighbourhood: location.name.toLowerCase().replace(/\s+/g, '-'),
        borough: 'pending',
        address: place.vicinity ?? '',
        postcode: '',
        cuisine_type: (place.types ?? []).includes('restaurant') ? 'Restaurant' : 'Café',
        price_range: place.price_level
          ? ['£', '£', '££', '$$$', '$$$'][place.price_level] ?? '££'
          : '££',
        google_rating: place.rating,
        review_count: place.user_ratings_total,
        kids_menu: 'no',
        highchairs: 'no',
        outdoor_space: 'no',
        soft_play: 'no',
        baby_changing: 'no',
        buggy_accessible: 'no',
        noise_level: 'moderate',
        best_for_age_range: [],
        booking_required: 'no',
        description: `[Pending review] New listing discovered via Google Places API. Needs enrichment.`,
        short_description: place.name,
        photos: [],
        tags: [],
        featured: false,
        published: false,
        pending_review: true,
      };

      const { error } = await supabase
        .from('restaurants')
        .upsert(row, { onConflict: 'id', ignoreDuplicates: true });

      if (!error) newCount++;
    }
  }

  console.log(`✅ Discovery complete. Added ${newCount} new listings to pending review queue.`);
}

run().catch(console.error);
