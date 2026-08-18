-- Adds a time-trend view alongside the existing weekday x hour heatmap, so
-- guests' reviews can be read "several ways" (as requested): the heatmap
-- answers "which day/hour is weak", the trend answers "is this aspect
-- getting better or worse over the selected period" — the second question
-- the product's own positioning against Google Review depends on
-- ("beavatkozhatsz, mielőtt gond lesz belőle") but that nothing on screen
-- actually showed before this.
--
-- Also adds a portfolio-wide daily review-volume chart for the admin
-- Áttekintés page — a heartbeat view across every partner combined,
-- complementing the existing per-partner "Szokatlan forgalom" spike detector
-- with the opposite failure mode: a sudden portfolio-wide DROP (e.g. every
-- QR code silently broke after a deploy) is exactly the kind of thing a
-- per-partner-only view would never surface.

-- ---------------------------------------------------------------------------
-- Per-partner, per-aspect trend within a window, bucketed at an ADAPTIVE
-- granularity rather than always daily: at 365 days or "all", daily buckets
-- would put hundreds of points on a chart with no readability benefit, so the
-- function picks day/week/month itself based on since_days. granularity is
-- returned as its own column (constant across the result set for one call)
-- so the client knows how to label the x-axis without re-deriving it from
-- date gaps, which would be fragile for a partner with sparse history.
-- ---------------------------------------------------------------------------
create function public.partner_aspect_trend_range(
  target_partner_id uuid,
  since_days integer default null
)
returns table (
  bucket_date date,
  granularity text,
  aspect_key text,
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
  v_granularity text := case
    when since_days is not null and since_days <= 31 then 'day'
    when since_days is not null and since_days <= 120 then 'week'
    else 'month'
  end;
begin
  perform public.partner_stats_authorize(target_partner_id);

  return query
  select
    date_trunc(v_granularity, s.created_at at time zone 'Europe/Budapest')::date,
    v_granularity,
    sc.aspect_key,
    avg(sc.score)::double precision,
    count(*)::bigint
  from public.submissions s
  join public.submission_scores sc on sc.submission_id = s.id
  where s.partner_id = target_partner_id
    and (v_cutoff is null or s.created_at >= v_cutoff)
  group by 1, 3
  order by 1;
end;
$$;

-- ---------------------------------------------------------------------------
-- Portfolio-wide daily submission counts, admin-only. Fixed at daily
-- granularity and a caller-supplied window (defaults to 30 days) — this is a
-- heartbeat chart, not a per-partner drill-down, so it deliberately has no
-- adaptive bucketing or period picker to keep it simple.
-- ---------------------------------------------------------------------------
create function public.portfolio_daily_review_counts(since_days integer default 30)
returns table (bucket_date date, review_count bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cutoff timestamptz := public.partner_stats_cutoff(since_days);
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  select
    (s.created_at at time zone 'Europe/Budapest')::date,
    count(distinct s.id)::bigint
  from public.submissions s
  where (v_cutoff is null or s.created_at >= v_cutoff)
  group by 1
  order by 1;
end;
$$;

revoke execute on function public.partner_aspect_trend_range(uuid, integer) from public, anon;
revoke execute on function public.portfolio_daily_review_counts(integer) from public, anon;

grant execute on function public.partner_aspect_trend_range(uuid, integer) to authenticated;
grant execute on function public.portfolio_daily_review_counts(integer) to authenticated;
