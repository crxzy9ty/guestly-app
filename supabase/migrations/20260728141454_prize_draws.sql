-- Code-review fix #7: the daily prize draw had no idempotency — every click
-- of "Mai nyertes sorsolása" picked a fresh winner (since the previous
-- winner was excluded via winner_id IS NULL), so two clicks meant two
-- coupons issued for one day. This table makes "already drew for this
-- partner today" a real, race-safe constraint instead of admin discipline.

create table public.prize_draws (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  draw_date date not null,
  submission_id uuid not null references public.submissions (id),
  winner_id text not null,
  drawn_at timestamptz not null default now(),
  unique (partner_id, draw_date)
);

alter table public.prize_draws enable row level security;

revoke all on public.prize_draws from anon, authenticated;
grant select, insert on public.prize_draws to authenticated;

create policy prize_draws_select_admin on public.prize_draws
  for select to authenticated
  using (public.is_admin());

create policy prize_draws_insert_admin on public.prize_draws
  for insert to authenticated
  with check (public.is_admin());
