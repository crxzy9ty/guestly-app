-- Lets each partner record their real opening hours, so the heatmap buckets
-- and renders against THAT window instead of the global fixed 8-20 range.
--
-- The fixed {8,10,12,14,16,18,20} columns (guestly_hour_bucket, see
-- ..._aggregate_stats_views.sql) badly misrepresent any venue not open
-- roughly 8-20: a bar open 18-02 gets its busiest hour (e.g. 01:00) snapped
-- to the NEAREST fixed column, which is 8 — a column the venue isn't even
-- open during — and a bakery open 6-14 has 4 of its 7 columns permanently
-- empty. Both are wrong in ways that actively mislead rather than just being
-- less useful.
--
-- open_hour/close_hour are nullable: a partner who hasn't set them keeps
-- today's exact 8-20 behaviour (partner_heatmap_stats_range coalesces to
-- 8/20 below), so this is additive, not a breaking change for existing rows.
-- close_hour < open_hour means the venue is open overnight (e.g. 18 -> 2),
-- the same wraparound convention guestly_hour_bucket already used for its
-- distance calculation.

alter table public.partners
  add column open_hour smallint,
  add column close_hour smallint;

alter table public.partners
  add constraint partners_open_hour_range check (open_hour is null or open_hour between 0 and 23),
  add constraint partners_close_hour_range check (close_hour is null or close_hour between 0 and 23),
  add constraint partners_hours_paired check ((open_hour is null) = (close_hour is null));

-- ---------------------------------------------------------------------------
-- Parameterized version of guestly_hour_bucket: instead of a fixed column
-- list, generates 2-hour-wide buckets starting at open_hour and stepping
-- forward (wrapping past midnight) up to and including close_hour, then
-- snaps h to the nearest one exactly like guestly_hour_bucket did (wraparound
-- distance, ties resolve to the earlier bucket). Left guestly_hour_bucket
-- itself untouched — it has no remaining callers in the app, so there is
-- nothing to migrate, and removing it isn't necessary for this change.
-- ---------------------------------------------------------------------------
create function public.partner_hour_bucket(h integer, open_hour integer, close_hour integer)
returns integer
language sql
immutable
set search_path = public
as $$
  select b
  from (
    select (open_hour + step * 2) % 24 as b
    from generate_series(
      0,
      -- Number of 2h steps from open to close, wrapping past midnight when
      -- close_hour <= open_hour (the overnight case).
      (case when close_hour > open_hour then close_hour - open_hour else 24 - open_hour + close_hour end) / 2
    ) as step
  ) as buckets
  order by least(abs(h - b), 24 - abs(h - b)), b
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Re-point the existing per-partner heatmap RPC at the parameterized bucket
-- function, using this partner's own hours (coalesced to the 8-20 default).
-- Everything else about the function — the authorization guard, the window
-- cutoff, the day_index calculation — is unchanged from
-- ..._partner_stats_date_range.sql.
-- ---------------------------------------------------------------------------
create or replace function public.partner_heatmap_stats_range(
  target_partner_id uuid,
  since_days integer default null
)
returns table (
  aspect_key text,
  day_index integer,
  hour_bucket integer,
  avg_score double precision,
  score_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cutoff timestamptz := public.partner_stats_cutoff(since_days);
  v_open_hour integer;
  v_close_hour integer;
begin
  perform public.partner_stats_authorize(target_partner_id);

  select coalesce(open_hour, 8), coalesce(close_hour, 20)
  into v_open_hour, v_close_hour
  from public.partners
  where id = target_partner_id;

  return query
  select sc.aspect_key,
         (extract(isodow from s.created_at at time zone 'Europe/Budapest')::integer - 1),
         public.partner_hour_bucket(
           extract(hour from s.created_at at time zone 'Europe/Budapest')::integer,
           v_open_hour,
           v_close_hour
         ),
         avg(sc.score)::double precision,
         count(*)::bigint
  from public.submissions s
  join public.submission_scores sc on sc.submission_id = s.id
  where s.partner_id = target_partner_id
    and (v_cutoff is null or s.created_at >= v_cutoff)
  group by 1, 2, 3;
end;
$$;
