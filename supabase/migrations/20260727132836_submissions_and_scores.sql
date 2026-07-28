-- One row per guest review submission, plus one row per rated aspect within it.
-- `email` / `prize_id` / `winner_id` are guest-provided prize-draw data that must
-- stay hidden from owners (see submissions_owner_view in the RLS migration) and
-- visible only to admins.

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  created_at timestamptz not null default now(),
  email text,
  prize_id text,
  winner_id text,
  dedup_token text
);

create index idx_submissions_partner_created on public.submissions (partner_id, created_at desc);
create index idx_submissions_dedup on public.submissions (partner_id, dedup_token);

create table public.submission_scores (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  aspect_key text not null,
  score smallint not null check (score between 1 and 10),
  reason text,
  created_at timestamptz not null default now(),
  unique (submission_id, aspect_key)
);

create index idx_submission_scores_submission_id on public.submission_scores (submission_id);
create index idx_submission_scores_aspect_key on public.submission_scores (aspect_key);
