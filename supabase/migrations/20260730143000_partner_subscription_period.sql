-- Subscription period per partner, so an admin can see at a glance who is
-- paying, who is about to lapse, and who has already lapsed.
--
-- Deliberately TWO DATES AND NO STATUS FLAG. A stored "is_subscriber" boolean
-- alongside the dates would be a second source of truth that silently drifts:
-- it needs flipping on the expiry date, by someone or something that remembers
-- to, and until then the flag and the dates disagree. Status is derived from
-- the dates instead (src/lib/subscription.ts), so it is always consistent and
-- always current without any scheduled job.
--
-- `date` rather than `timestamptz`: a subscription runs in whole days, and
-- day-granular values sidestep the "does the 31st end at 00:00 or 23:59, and
-- in which timezone" question entirely.
--
-- Both nullable. NULL/NULL is a real and common state — a prospect being
-- demoed, or a partner onboarded before billing was agreed — and must not be
-- confused with "expired".
--
-- NOTE: this is informational only. Nothing in the app gates access on these
-- dates yet: an expired partner's QR codes keep collecting reviews and their
-- owner keeps being able to log in. Cutting off a lapsed venue mid-service
-- would punish that venue's GUESTS, not the venue, so enforcement is a
-- separate product decision rather than an implied consequence of this column.

alter table public.partners
  add column subscription_start date,
  add column subscription_end date;

-- Guards against a period that ends before it begins — an easy typo when
-- entering dates by hand, and one that would make the derived status
-- nonsensical rather than merely wrong.
alter table public.partners
  add constraint partners_subscription_period_valid
  check (
    subscription_start is null
    or subscription_end is null
    or subscription_end >= subscription_start
  );

-- The admin overview and partners table both want "who expires soonest";
-- partial index because rows without an end date are never part of that answer.
create index idx_partners_subscription_end
  on public.partners (subscription_end)
  where subscription_end is not null;

comment on column public.partners.subscription_start is
  'First day of the paid period (inclusive). NULL = no subscription recorded.';
comment on column public.partners.subscription_end is
  'Last day of the paid period (inclusive). NULL = no subscription recorded. Past date = lapsed; data is retained regardless.';
