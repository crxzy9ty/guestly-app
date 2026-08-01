-- Shows the admin when each partner last actually used the product.
--
-- Two different signals, deliberately both:
--   * last_owner_seen_at — when a partner last opened their dashboard. For a
--     subscription business this is the churn signal: someone who stopped
--     looking has stopped getting value, and will cancel before they say so.
--   * last_review_at — when a guest last submitted. This says whether the QR
--     code is still out on the tables and working.
--
-- They fail in opposite directions, which is why one number would not do:
-- logins but no reviews means the QR placement is the problem; reviews but no
-- logins means the partner isn't getting anything out of it.

alter table public.profiles add column last_seen_at timestamptz;

-- SECURITY: this exists instead of granting owners UPDATE on their own profile
-- row. `profiles` also holds `role`, so a self-update policy would let any
-- owner promote themselves to admin. A security-definer function that touches
-- exactly one column for exactly auth.uid() cannot be turned into that.
--
-- Self-throttling: the WHERE clause makes a repeat call within 15 minutes a
-- no-op, so a partner refreshing their dashboard doesn't generate a write per
-- page view. "Last seen" needs to be roughly right, not to the second.
create function public.touch_last_seen()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set last_seen_at = now()
  where id = auth.uid()
    and (last_seen_at is null or last_seen_at < now() - interval '15 minutes');
$$;

revoke execute on function public.touch_last_seen() from public, anon;
grant execute on function public.touch_last_seen() to authenticated;

-- Admin-only: this is portfolio management data, not something a partner
-- should see about themselves or anyone else.
create view public.partner_activity as
select
  p.id as partner_id,
  max(pr.last_seen_at) as last_owner_seen_at,
  (select max(s.created_at) from public.submissions s where s.partner_id = p.id) as last_review_at,
  count(distinct pm.user_id)::integer as owner_count
from public.partners p
left join public.partner_members pm on pm.partner_id = p.id
left join public.profiles pr on pr.id = pm.user_id
where public.is_admin()
group by p.id;

grant select on public.partner_activity to authenticated;

comment on view public.partner_activity is
  'Per-partner engagement for the admin Partners tab: last owner dashboard visit, last guest review, and how many owner accounts are linked.';
