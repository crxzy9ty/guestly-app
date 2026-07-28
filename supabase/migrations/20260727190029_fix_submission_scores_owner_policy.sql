-- Bug fix: submission_scores_select referenced public.submissions directly in
-- an EXISTS subquery. Unlike submissions_owner_view (a view, which reads its
-- base table with the view-owner's privileges), a plain RLS policy expression
-- that queries another RLS-protected table is still subject to THAT table's
-- RLS for the current caller. Owners have zero SELECT policy on submissions
-- (by design — they can only reach it via the masked view), so the subquery
-- always saw 0 rows and the policy silently evaluated to false for every
-- owner, no matter how many scores actually existed.
--
-- Fix: look up the submission's partner_id via a security-definer function
-- (bypasses submissions' RLS internally, same pattern as is_admin()/
-- is_partner_member()), then check partner membership normally.

create function public.submission_partner_id(target_submission_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select partner_id from public.submissions where id = target_submission_id;
$$;

drop policy submission_scores_select on public.submission_scores;

create policy submission_scores_select on public.submission_scores
  for select to authenticated
  using (
    public.is_admin()
    or public.is_partner_member(public.submission_partner_id(submission_id))
  );
