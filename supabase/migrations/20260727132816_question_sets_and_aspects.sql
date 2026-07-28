-- Reusable, named collections of rating aspects ("kérdéscsoportok") that can be
-- assigned to one or more partners. Every install starts with a default set.

create table public.question_sets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_aspects (
  id uuid primary key default gen_random_uuid(),
  question_set_id uuid not null references public.question_sets (id) on delete cascade,
  key text not null,
  label text not null,
  icon text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (question_set_id, key)
);

create index idx_question_aspects_set_sort on public.question_aspects (question_set_id, sort_order);

-- Seed the default question set, matching DEFAULT_ASPECTS from the guestly-landing.jsx prototype.
insert into public.question_sets (id, name) values
  ('00000000-0000-0000-0000-000000000001', 'Alap kérdések');

insert into public.question_aspects (question_set_id, key, label, icon, sort_order) values
  ('00000000-0000-0000-0000-000000000001', 'tisztasag', 'Tisztaság', '✦', 1),
  ('00000000-0000-0000-0000-000000000001', 'gyorsasag', 'Kiszolgálás gyorsasága', '⚡', 2),
  ('00000000-0000-0000-0000-000000000001', 'kiszolgalas', 'Kiszolgálás minősége', '♥', 3),
  ('00000000-0000-0000-0000-000000000001', 'etel', 'Étel-ital minősége', '☕', 4),
  ('00000000-0000-0000-0000-000000000001', 'hangulat', 'Hangulat', '✺', 5);
