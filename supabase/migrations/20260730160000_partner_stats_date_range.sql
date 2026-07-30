-- Audit finding #8: the per-venue Áttekintés aggregated the ENTIRE history
-- into one weekday x hour grid, with no way to narrow it.
--
-- That is precisely the flaw the landing page holds against Google Review —
-- "Egy 5 éves múlt átlaga — egy rossz hónap alig mozgatja" — reproduced in our
-- own product. The heatmap card even said "heti bontás" while showing
-- all-time data. A venue that fixed a problem three months ago still had it
-- dragging their averages down, which is the opposite of the promise.
--
-- Why functions and not date-filterable views: a view would have to expose a
-- date dimension for PostgREST to filter on, and at day granularity that is
-- (aspects x days) rows — 5 x 365 = 1825 for a single year, straight back over
-- the max_rows = 1000 cap that ..._aggregate_stats_views.sql existed to escape.
-- Parameterising the aggregation keeps the row count bounded by the OUTPUT
-- shape regardless of how much history is scanned.
--
-- SECURITY: `security definer` (they must read submissions, which owners have
-- no SELECT policy on) with an explicit authorization guard as the first
-- statement. The guard RAISES rather than returning an empty set: an empty
-- result is indistinguishable from "this venue has no reviews yet", which
-- would turn an authorization bug into a silent one.
--
-- since_days NULL means all time, so the existing behaviour is still reachable.

create function public.partner_stats_authorize(target_partner_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or public.is_partner_member(target_partner_id)) then
    raise exception 'not authorized for partner %', target_partner_id
      using errcode = '42501';
  end if;
end;
$$;

-- Shared cutoff calculation so the three functions below cannot disagree about
-- what "last 30 days" means. NULL in, NULL out (= no lower bound).
create function public.partner_stats_cutoff(since_days integer)
returns timestamptz
language sql
immutable
set search_path = public
as $$
  select case
    when since_days is null then null
    else now() - make_interval(days => since_days)
  end;
$$;

-- ---------------------------------------------------------------------------
-- Per-aspect averages within a window.
-- ---------------------------------------------------------------------------
create function public.partner_aspect_stats_range(
  target_partner_id uuid,
  since_days integer default null
)
returns table (aspect_key text, avg_score double precision, score_count bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cutoff timestamptz := public.partner_stats_cutoff(since_days);
begin
  perform public.partner_stats_authorize(target_partner_id);

  return query
  select sc.aspect_key,
         avg(sc.score)::double precision,
         count(*)::bigint
  from public.submissions s
  join public.submission_scores sc on sc.submission_id = s.id
  where s.partner_id = target_partner_id
    and (v_cutoff is null or s.created_at >= v_cutoff)
  group by sc.aspect_key;
end;
$$;

-- ---------------------------------------------------------------------------
-- Heatmap cells within a window, bucketed in Budapest local time. day_index is
-- 0-6 for Mon-Sun, matching the DAYS array in src/lib/dashboard/heatmap.ts.
-- ---------------------------------------------------------------------------
create function public.partner_heatmap_stats_range(
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
begin
  perform public.partner_stats_authorize(target_partner_id);

  return query
  select sc.aspect_key,
         (extract(isodow from s.created_at at time zone 'Europe/Budapest')::integer - 1),
         public.guestly_hour_bucket(
           extract(hour from s.created_at at time zone 'Europe/Budapest')::integer
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

-- ---------------------------------------------------------------------------
-- Headline counters within a window. Always exactly one row, so the caller can
-- read it with .single() and never has to special-case a venue with no reviews
-- in the selected period.
-- ---------------------------------------------------------------------------
create function public.partner_summary_range(
  target_partner_id uuid,
  since_days integer default null
)
returns table (review_count bigint, prize_count bigint, avg_score double precision)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cutoff timestamptz := public.partner_stats_cutoff(since_days);
begin
  perform public.partner_stats_authorize(target_partner_id);

  return query
  select count(distinct s.id)::bigint,
         count(distinct s.id) filter (where s.prize_id is not null)::bigint,
         avg(sc.score)::double precision
  from public.submissions s
  left join public.submission_scores sc on sc.submission_id = s.id
  where s.partner_id = target_partner_id
    and (v_cutoff is null or s.created_at >= v_cutoff);
end;
$$;

-- anon must never reach these: they carry no PII, but they would still let an
-- unauthenticated caller enumerate any venue's performance by id.
revoke execute on function public.partner_aspect_stats_range(uuid, integer) from public, anon;
revoke execute on function public.partner_heatmap_stats_range(uuid, integer) from public, anon;
revoke execute on function public.partner_summary_range(uuid, integer) from public, anon;
revoke execute on function public.partner_stats_authorize(uuid) from public, anon;

grant execute on function public.partner_aspect_stats_range(uuid, integer) to authenticated;
grant execute on function public.partner_heatmap_stats_range(uuid, integer) to authenticated;
grant execute on function public.partner_summary_range(uuid, integer) to authenticated;
