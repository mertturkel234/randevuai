-- RandevuAI initial schema

create extension if not exists "pgcrypto";

create type sector_type as enum ('kuaför', 'klinik', 'avukat', 'emlak', 'diğer');
create type subscription_status as enum ('trial', 'active', 'cancelled');
create type appointment_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
create type user_role as enum ('owner', 'staff');

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Yeni İşletme',
  phone text,
  whatsapp_number text,
  whatsapp_phone_number_id text,
  sector sector_type not null default 'diğer',
  timezone text not null default 'Europe/Istanbul',
  working_hours jsonb not null default '{
    "monday": {"open": "09:00", "close": "18:00"},
    "tuesday": {"open": "09:00", "close": "18:00"},
    "wednesday": {"open": "09:00", "close": "18:00"},
    "thursday": {"open": "09:00", "close": "18:00"},
    "friday": {"open": "09:00", "close": "18:00"},
    "saturday": {"open": "10:00", "close": "16:00"},
    "sunday": {"open": "09:00", "close": "18:00", "closed": true}
  }'::jsonb,
  google_calendar_id text,
  google_refresh_token text,
  subscription_status subscription_status not null default 'trial',
  admin_whatsapp text,
  daily_message_count integer not null default 0,
  daily_message_reset_at timestamptz,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  role user_role not null default 'owner',
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  duration_minutes integer not null default 30,
  price numeric(10,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  service_id uuid references public.services(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status appointment_status not null default 'confirmed',
  google_event_id text,
  notes text,
  reminder_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_phone text not null,
  customer_name text,
  messages jsonb not null default '[]'::jsonb,
  state jsonb not null default '{
    "step": "greeting",
    "selected_service_id": null,
    "selected_date": null,
    "selected_time": null,
    "customer_name": null
  }'::jsonb,
  updated_at timestamptz not null default now(),
  unique (business_id, customer_phone)
);

create index idx_services_business on public.services(business_id);
create index idx_appointments_business on public.appointments(business_id);
create index idx_appointments_start on public.appointments(start_time);
create index idx_conversations_business on public.conversations(business_id);
create index idx_profiles_business on public.profiles(business_id);

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.conversations enable row level security;

create or replace function public.get_user_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select business_id from public.profiles where id = auth.uid()
$$;

create policy "Users can view own business"
  on public.businesses for select
  using (id = public.get_user_business_id());

create policy "Users can update own business"
  on public.businesses for update
  using (id = public.get_user_business_id());

create policy "Users can view own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

create policy "Users can view own services"
  on public.services for select
  using (business_id = public.get_user_business_id());

create policy "Users can insert own services"
  on public.services for insert
  with check (business_id = public.get_user_business_id());

create policy "Users can update own services"
  on public.services for update
  using (business_id = public.get_user_business_id());

create policy "Users can view own appointments"
  on public.appointments for select
  using (business_id = public.get_user_business_id());

create policy "Users can insert own appointments"
  on public.appointments for insert
  with check (business_id = public.get_user_business_id());

create policy "Users can update own appointments"
  on public.appointments for update
  using (business_id = public.get_user_business_id());

create policy "Users can view own conversations"
  on public.conversations for select
  using (business_id = public.get_user_business_id());

-- Auto-create business + profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_business_id uuid;
begin
  insert into public.businesses (name)
  values (coalesce(new.raw_user_meta_data->>'business_name', 'Yeni İşletme'))
  returning id into new_business_id;

  insert into public.profiles (id, business_id, role)
  values (new.id, new_business_id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger for conversations
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();
