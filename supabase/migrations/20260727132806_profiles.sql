-- One profile row per auth.users row. Created automatically by a trigger
-- (see auth_helper_functions_and_triggers migration), never inserted by app code directly.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role app_role not null default 'owner',
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'App-level profile for each auth.users row: role + denormalized email for display without calling the Admin API.';
