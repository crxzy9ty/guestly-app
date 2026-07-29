-- dedup_token was write-only: src/app/actions/reviews.ts generated a fresh
-- random UUID on every insert (not derived from the actual dedup cookie),
-- so it was never a usable device/session signal, and nothing ever read it.
-- idx_submissions_dedup indexed a column whose values are 100% unique random
-- data — pure overhead. Dropping the column drops the index with it.
alter table public.submissions drop column dedup_token;
