-- Google İşletme Profili alanları

alter table public.businesses
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists google_place_id text,
  add column if not exists google_business_url text,
  add column if not exists google_business_data jsonb;
