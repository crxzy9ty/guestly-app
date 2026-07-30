-- Records whether the winner's coupon email actually went out.
--
-- sendEmail() is deliberately best-effort: a failed send must not undo a draw
-- that is already recorded. But nothing surfaced the failure either, so the
-- outcome was invisible — the draw looked complete, the winner never heard,
-- and no one found out. For a guest that means the prize draw they gave their
-- address for simply does not exist.
--
-- Kept on submissions rather than prize_draws so it sits next to winner_id and
-- comes through submission_log_view without a join — the Napló is where an
-- admin would notice and act on it, by reading the code out to the guest.

alter table public.submissions add column winner_email_status text;

alter table public.submissions
  add constraint submissions_winner_email_status_valid
  check (winner_email_status is null or winner_email_status in ('sent', 'failed', 'not-configured', 'no-email'));

comment on column public.submissions.winner_email_status is
  'Outcome of the prize-winner notification: sent | failed | not-configured (no RESEND_API_KEY) | no-email. NULL for non-winners.';

-- Recreate the log view with the new column. Masked for non-admins like the
-- other prize fields: an owner has no business seeing prize-draw internals.
create or replace view public.submission_log_view as
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
  ) as reasons,
  case when public.is_admin() then s.winner_email_status end as winner_email_status
from public.submissions s
left join public.submission_scores sc on sc.submission_id = s.id
where public.is_admin() or public.is_partner_member(s.partner_id)
group by s.id, s.partner_id, s.created_at, s.email, s.prize_id, s.winner_id, s.winner_email_status;
