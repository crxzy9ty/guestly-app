-- A partner is one venue/egység. An owner (profiles.role = 'owner') can belong
-- to more than one partner, and a partner could in principle have more than one
-- owner-user, hence the many-to-many partner_members join table.

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  email text,
  contact_name text,
  contact_phone text,
  question_set_id uuid references public.question_sets (id) on delete set null default '00000000-0000-0000-0000-000000000001',
  alert_threshold numeric(3, 1) not null default 6.5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_partners_question_set_id on public.partners (question_set_id);

create table public.partner_members (
  partner_id uuid not null references public.partners (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (partner_id, user_id)
);

create index idx_partner_members_user_id on public.partner_members (user_id);
create index idx_partner_members_partner_id on public.partner_members (partner_id);
