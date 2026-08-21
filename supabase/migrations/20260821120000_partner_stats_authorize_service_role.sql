-- Lets the server-only admin/service-role client read a partner's stats
-- through the existing RPC functions (partner_summary_range,
-- partner_aspect_stats_range, partner_heatmap_stats_range,
-- partner_aspect_trend_range, partner_aspect_stats_wow) — all five share
-- this one authorization gate — without holding a real owner/admin session.
--
-- Needed for the public, no-login demo page at /demo/elonezet
-- (src/app/demo/elonezet/page.tsx), which reuses the exact same RPCs the
-- real owner dashboard and admin venue-detail page use, pointed at one
-- fixed, clearly-marked demo partner — so the demo numbers are guaranteed
-- to be computed identically to what a real partner sees, not a second,
-- drifting implementation.
--
-- Safe to add: SUPABASE_SECRET_KEY (which PostgREST maps to the
-- `service_role` Postgres role) is a server-only secret used only from
-- src/lib/supabase/admin.ts, which is import "server-only" gated — it never
-- reaches the browser, so nothing outside this codebase's own server-side
-- code can ever present as service_role. This does not touch what an
-- `authenticated` owner/admin session can see; is_admin()/is_partner_member()
-- still gate those exactly as before.
create or replace function public.partner_stats_authorize(target_partner_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if current_setting('role', true) = 'service_role' then
    return;
  end if;

  if not (public.is_admin() or public.is_partner_member(target_partner_id)) then
    raise exception 'not authorized for partner %', target_partner_id
      using errcode = '42501';
  end if;
end;
$$;
