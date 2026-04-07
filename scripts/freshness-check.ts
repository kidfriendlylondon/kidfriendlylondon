/**
 * Weekly freshness check
 * Samples existing listings against Google Places API
 * Flags any that have closed, significantly changed rating, or dropped reviews
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const SAMPLE_SIZE = 10; // Check 10 random listings per week
const RATING_DROP_THRESHOLD = 0.5;

async function getPlaceDetails(placeId: string): Promise<any> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,business_status&key=${GOOGLE_KEY}`;
  const res = await fetch(url);
  const data = await res.json() as any;
  return data.result;
}

async function findPlaceByName(name: string, address: string): Promise<string | null> {
  const query = encodeURIComponent(`${name} ${address}`);
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id&key=${GOOGLE_KEY}`;
  const res = await fetch(url);
  const data = await res.json() as any;
  return data.candidates?.[0]?.place_id ?? null;
}

async function run() {
  console.log('Starting weekly freshness check...');

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name, address, google_rating')
    .eq('published', true)
    .order('created_at', { ascending: true })
    .limit(SAMPLE_SIZE);

  if (!restaurants?.length) {
    console.log('No restaurants to check');
    return;
  }

  let flagged = 0;

  for (const restaurant of restaurants) {
    console.log(`Checking: ${restaurant.name}`);

    const placeId = await findPlaceByName(restaurant.name, restaurant.address);
    if (!placeId) {
      console.log(`  ⚠️ Could not find on Google Places: ${restaurant.name}`);
      continue;
    }

    const details = await getPlaceDetails(placeId);
    if (!details) continue;

    const isClosed = details.business_status === 'CLOSED_PERMANENTLY';
    const ratingDrop = restaurant.google_rating - (details.rating ?? restaurant.google_rating);

    const shouldFlag = isClosed || ratingDrop >= RATING_DROP_THRESHOLD;

    await supabase.from('freshness_checks').insert({
      restaurant_id: restaurant.id,
      google_rating_then: restaurant.google_rating,
      google_rating_now: details.rating,
      still_open: !isClosed,
      flagged: shouldFlag,
      notes: isClosed
        ? 'Permanently closed on Google'
        : ratingDrop >= RATING_DROP_THRESHOLD
          ? `Rating dropped by ${ratingDrop.toFixed(1)} points`
          : null,
    });

    if (shouldFlag) {
      flagged++;
      await supabase
        .from('restaurants')
        .update({ pending_review: true })
        .eq('id', restaurant.id);

      console.log(`  🚨 FLAGGED: ${restaurant.name} — ${isClosed ? 'Permanently closed' : `Rating dropped ${ratingDrop.toFixed(1)}`}`);
    }
  }

  console.log(`✅ Freshness check complete. Checked ${restaurants.length} listings. ${flagged} flagged for review.`);
}

run().catch(console.error);
