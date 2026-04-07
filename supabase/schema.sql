-- Kid Friendly London — Supabase Schema
-- Run this in the Supabase SQL editor to create all required tables

-- Restaurants table
create table if not exists restaurants (
  id text primary key,
  slug text unique not null,
  name text not null,
  neighbourhood text not null,
  borough text not null,
  address text not null,
  postcode text,
  phone text,
  website text,
  cuisine_type text not null,
  price_range text not null check (price_range in ('£', '££', '$$$')),
  google_rating numeric(2,1),
  review_count integer default 0,
  opening_hours jsonb,
  lat numeric(9,6),
  lng numeric(9,6),
  -- Qualitative attributes
  kids_menu text default 'no' check (kids_menu in ('yes', 'no', 'likely')),
  highchairs text default 'no' check (highchairs in ('yes', 'no', 'likely')),
  outdoor_space text default 'no' check (outdoor_space in ('yes', 'no')),
  soft_play text default 'no' check (soft_play in ('yes', 'no')),
  baby_changing text default 'no' check (baby_changing in ('yes', 'no')),
  buggy_accessible text default 'no' check (buggy_accessible in ('yes', 'no', 'likely')),
  noise_level text check (noise_level in ('quiet', 'moderate', 'lively')),
  best_for_age_range text[] default '{}',
  booking_required text default 'no' check (booking_required in ('yes', 'no', 'recommended')),
  -- Content
  description text,
  short_description text,
  photos text[] default '{}',
  tags text[] default '{}',
  -- Monetisation
  featured boolean default false,
  featured_since date,
  opentable_id text,
  -- Admin
  published boolean default true,
  pending_review boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Restaurant suggestions (from "Suggest a Restaurant" form)
create table if not exists restaurant_suggestions (
  id bigserial primary key,
  restaurant_name text not null,
  address text not null,
  neighbourhood text not null,
  why_family_friendly text,
  submitter_email text,
  status text default 'pending' check (status in ('pending', 'reviewed', 'added', 'rejected')),
  created_at timestamptz default now()
);

-- Featured listing enquiries
create table if not exists featured_enquiries (
  id bigserial primary key,
  restaurant_name text not null,
  contact_name text,
  email text not null,
  neighbourhood text,
  status text default 'new' check (status in ('new', 'contacted', 'active', 'cancelled')),
  created_at timestamptz default now()
);

-- Email subscribers (backup — use Mailchimp as primary)
create table if not exists email_subscribers (
  id bigserial primary key,
  email text unique not null,
  source text, -- 'homepage', 'neighbourhood', 'manchester', 'edinburgh'
  created_at timestamptz default now()
);

-- Freshness checks log
create table if not exists freshness_checks (
  id bigserial primary key,
  restaurant_id text references restaurants(id),
  checked_at timestamptz default now(),
  google_rating_then numeric(2,1),
  google_rating_now numeric(2,1),
  still_open boolean,
  flagged boolean default false,
  notes text
);

-- Indexes
create index if not exists idx_restaurants_neighbourhood on restaurants(neighbourhood);
create index if not exists idx_restaurants_borough on restaurants(borough);
create index if not exists idx_restaurants_featured on restaurants(featured) where featured = true;
create index if not exists idx_restaurants_published on restaurants(published) where published = true;
create index if not exists idx_restaurants_slug on restaurants(slug);

-- Enable Row Level Security (RLS)
alter table restaurants enable row level security;
alter table restaurant_suggestions enable row level security;
alter table featured_enquiries enable row level security;
alter table email_subscribers enable row level security;

-- Public read access for published restaurants
create policy "Public can read published restaurants"
  on restaurants for select
  using (published = true);

-- Only service role can write
create policy "Service role can manage restaurants"
  on restaurants for all
  using (auth.role() = 'service_role');

create policy "Anyone can insert suggestions"
  on restaurant_suggestions for insert
  with check (true);

create policy "Service role can manage suggestions"
  on restaurant_suggestions for all
  using (auth.role() = 'service_role');

create policy "Anyone can insert featured enquiries"
  on featured_enquiries for insert
  with check (true);

create policy "Anyone can insert email subscribers"
  on email_subscribers for insert
  with check (true);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger restaurants_updated_at
  before update on restaurants
  for each row execute function update_updated_at();
