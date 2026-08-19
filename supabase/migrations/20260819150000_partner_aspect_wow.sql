-- Week-over-week change indicator for the aspect tiles (Áttekintés), shown as
-- an up/down arrow + delta next to each aspect's average — independent of
-- whatever window the period picker is currently set to, always comparing
-- the last 7 days against the 7 days before that.
--
-- One row per aspect (bounded, same pattern as every other *_range function),
-- both averages computed in one pass so the two windows can never disagree
-- about "now".

create function public.partner_aspect_stats_wow(target_partner_id uuid)
returns table (
  aspect_key text,
  current_avg double precision,
  previous_avg double precision,
  current_count bigint,
  previous_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  perform public.partner_stats_authorize(target_partner_id);

  return query
  select
    sc.aspect_key,
    avg(sc.score) filter (where s.created_at >= v_now - interval '7 days')::double precision,
    avg(sc.score) filter (
      where s.created_at < v_now - interval '7 days' and s.created_at >= v_now - interval '14 days'
    )::double precision,
    count(*) filter (where s.created_at >= v_now - interval '7 days')::bigint,
    count(*) filter (
      where s.created_at < v_now - interval '7 days' and s.created_at >= v_now - interval '14 days'
    )::bigint
  from public.submissions s
  join public.submission_scores sc on sc.submission_id = s.id
  where s.partner_id = target_partner_id
    and s.created_at >= v_now - interval '14 days'
  group by sc.aspect_key;
end;
$$;

revoke execute on function public.partner_aspect_stats_wow(uuid) from public, anon;
grant execute on function public.partner_aspect_stats_wow(uuid) to authenticated;
