-- Audit finding #2 + #3 (reference/audit-2026-07-30.md): move every dashboard
-- aggregation out of JS and into SQL.
--
-- What was broken:
--   * PostgREST caps responses at `max_rows = 1000` (supabase/config.toml) and
--     does so SILENTLY — no error, no indication of truncation. The admin
--     overview selected every `submissions` AND every `submission_scores` row
--     with no limit and no ORDER BY, then averaged them in JS. At ~5 scores per
--     submission that ceiling is hit at roughly 200 total reviews, after which
--     every KPI (24h/7d counts, venue averages, "Figyelendő egységek") was
--     computed from an arbitrary, non-deterministic subset.
--   * The owner dashboard fetched up to 1000 submission ids and passed them to
--     `.in("submission_id", ids)`, which PostgREST serialises into the query
--     string: ~1000 x 39 chars ≈ 40 KB of URL, well past the point where the
--     request fails with 414 URI Too Long.
--
-- The fix is the same for both: aggregate in Postgres and return a bounded
-- number of rows. Row counts per query are now O(aspects) or O(days x hours),
-- never O(submissions).
--
-- ACCESS CONTROL: these views deliberately follow the existing
-- `submissions_owner_view` pattern — created by the migration role, so they
-- read the base tables with RLS bypassed internally, with an explicit
-- `is_admin() or is_partner_member(...)` predicate doing the row restriction
-- instead. This is required rather than stylistic: owners have NO select
-- policy on `submissions` at all (see ..._rls_policies_and_grants.sql), so a
-- `security_invoker` view would return them nothing.

-- ---------------------------------------------------------------------------
-- Hour bucketing, previously duplicated in TypeScript (nearestHourBucket).
-- Snaps a real hour (0-23) to the nearest displayed column in
-- {8,10,12,14,16,18,20}, wrapping around midnight so 23:xx lands on 20 rather
-- than 8. Ties resolve to the earlier hour, matching the strict `<` comparison
-- the TypeScript version used while iterating the hours in ascending order.
-- ---------------------------------------------------------------------------
create function public.guestly_hour_bucket(h integer)
returns integer
language sql
immutable
set search_path = public
as $$
  select b
  from (values (8), (10), (12), (14), (16), (18), (20)) as buckets(b)
  order by least(abs(h - b), 24 - abs(h - b)), b
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Per-partner, per-aspect averages. Replaces computeAspectAverages() in JS.
-- At most (partners x aspects) rows — ~150 for 30 partners with 5 aspects.
-- ---------------------------------------------------------------------------
create view public.partner_aspect_stats as
select
  s.partner_id,
  sc.aspect_key,
  avg(sc.score)::double precision as avg_score,
  count(*)::bigint as score_count
from public.submissions s
join public.submission_scores sc on sc.submission_id = s.id
where public.is_admin() or public.is_partner_member(s.partner_id)
group by s.partner_id, sc.aspect_key;

-- ---------------------------------------------------------------------------
-- Per-partner, per-aspect heatmap cells, bucketed in Budapest local time (the
-- bucketing must not depend on the server's timezone — "péntek este" has to
-- mean the same thing wherever this is deployed).
--
-- day_index is 0-6 for Mon-Sun, matching the DAYS array in
-- src/lib/dashboard/heatmap.ts (isodow is 1-7 for Mon-Sun, hence the -1).
--
-- Bounded at (aspects x 7 days x 7 hour buckets) per partner = 245 rows for a
-- 5-aspect question set, regardless of how many reviews back it.
-- ---------------------------------------------------------------------------
create view public.partner_heatmap_stats as
select
  s.partner_id,
  sc.aspect_key,
  (extract(isodow from s.created_at at time zone 'Europe/Budapest')::integer - 1) as day_index,
  public.guestly_hour_bucket(extract(hour from s.created_at at time zone 'Europe/Budapest')::integer) as hour_bucket,
  avg(sc.score)::double precision as avg_score,
  count(*)::bigint as score_count
from public.submissions s
join public.submission_scores sc on sc.submission_id = s.id
where public.is_admin() or public.is_partner_member(s.partner_id)
group by 1, 2, 3, 4;

-- ---------------------------------------------------------------------------
-- One row per partner with the headline counters. `count(distinct s.id)` is
-- required rather than `count(*)`: joining submission_scores fans each
-- submission out into one row per rated aspect.
--
-- LEFT JOINs so a partner with zero reviews still gets a row (0 / null),
-- which is what both dashboards want to render.
-- ---------------------------------------------------------------------------
create view public.partner_summary_stats as
select
  p.id as partner_id,
  count(distinct s.id)::bigint as review_count,
  count(distinct s.id) filter (where s.prize_id is not null)::bigint as prize_count,
  count(distinct s.id) filter (where s.created_at >= now() - interval '24 hours')::bigint as reviews_24h,
  count(distinct s.id) filter (where s.created_at >= now() - interval '7 days')::bigint as reviews_7d,
  avg(sc.score)::double precision as avg_score
from public.partners p
left join public.submissions s on s.partner_id = p.id
left join public.submission_scores sc on sc.submission_id = s.id
where public.is_admin() or public.is_partner_member(p.id)
group by p.id;

-- ---------------------------------------------------------------------------
-- The Napló, one row per submission with its scores/reasons pre-folded into
-- JSON objects. This is what removes the `.in(<ids>)` round trip entirely:
-- `limit 300` now means 300 submissions WITH their scores, instead of 300
-- submissions plus a second 40 KB-URL request that could also be silently
-- truncated at 1000 score rows.
--
-- PII (email / prize_id / winner_id) is masked per-row for non-admins, which
-- is what `submissions_owner_view` achieved by omitting the columns outright.
-- Owners keep seeing NULL there; admins see the real values.
-- ---------------------------------------------------------------------------
create view public.submission_log_view as
select
  s.id,
  s.partner_id,
  s.created_at,
  case when public.is_admin() then s.email end as email,
  case when public.is_admin() then s.prize_id end as prize_id,
  case when public.is_admin() then s.winner_id end as winner_id,
  coalesce(
    jsonb_object_agg(sc.aspect_key, sc.score) filter (where sc.aspect_key is not null),
    '{}'::jsonb
  ) as scores,
  coalesce(
    jsonb_object_agg(sc.aspect_key, sc.reason) filter (where sc.reason is not null),
    '{}'::jsonb
  ) as reasons
from public.submissions s
left join public.submission_scores sc on sc.submission_id = s.id
where public.is_admin() or public.is_partner_member(s.partner_id)
group by s.id, s.partner_id, s.created_at, s.email, s.prize_id, s.winner_id;

grant select on public.partner_aspect_stats to authenticated;
grant select on public.partner_heatmap_stats to authenticated;
grant select on public.partner_summary_stats to authenticated;
grant select on public.submission_log_view to authenticated;

-- Supporting index: every view above joins scores back to their submission and
-- filters submissions by partner. The existing
-- idx_submissions_partner_created covers the partner side; this one keeps the
-- created_at ordering the Napló asks for cheap on the score join.
create index if not exists idx_submission_scores_submission_aspect
  on public.submission_scores (submission_id, aspect_key);
