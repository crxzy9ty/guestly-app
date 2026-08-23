-- Replaces the hardcoded "daily draw for everyone" with a per-partner
-- weekly/monthly choice, plus letting each partner name their own prize.
--
-- prize_description = null means the partner isn't offering anything of
-- their own — the guest-facing copy and the winner email fall back to
-- content_settings' defaultPrizeDescription (see src/lib/content.ts)
-- instead, resolved in application code, not here.
--
-- No change to prize_draws: its draw_date column (a plain date, unique per
-- partner) gets reinterpreted at the application layer as "period start"
-- (the Monday of the week, or the 1st of the month) instead of "calendar
-- day" — nothing in the schema encodes that meaning, and nothing else reads
-- draw_date as a literal calendar day, so existing historical rows and the
-- idempotency constraint both keep working unchanged.
alter table public.partners
  add column prize_frequency text not null default 'weekly'
    check (prize_frequency in ('weekly', 'monthly')),
  add column prize_description text;
