-- Row Level Security for every table, PLUS explicit REVOKE/GRANT on each one.
--
-- IMPORTANT: Supabase's template database grants broad default privileges
-- (select/insert/update/delete) on every new public table to `anon` and
-- `authenticated` roles. RLS alone does not remove those grants — a table with
-- RLS enabled but no restrictive policy for a role can still be fully open if
-- the role already has table-level privileges and a permissive "true" policy
-- exists (or, for roles with no matching policy at all, RLS correctly denies
-- access — but we make the grants explicit anyway so this is never left
-- implicit or dependent on remembering how Postgres RLS defaults behave).

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select, update on public.profiles to authenticated;
-- insert happens only via the handle_new_user() trigger (security definer), never directly.

create policy profiles_select_self_or_admin on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- partners
-- ---------------------------------------------------------------------------
alter table public.partners enable row level security;

revoke all on public.partners from anon, authenticated;
grant select, insert, update, delete on public.partners to authenticated;

create policy partners_select on public.partners
  for select to authenticated
  using (public.is_admin() or public.is_partner_member(id));

create policy partners_insert_admin on public.partners
  for insert to authenticated
  with check (public.is_admin());

create policy partners_update_admin on public.partners
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy partners_delete_admin on public.partners
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- partner_members
-- ---------------------------------------------------------------------------
alter table public.partner_members enable row level security;

revoke all on public.partner_members from anon, authenticated;
grant select, insert, update, delete on public.partner_members to authenticated;

create policy partner_members_select on public.partner_members
  for select to authenticated
  using (public.is_admin() or user_id = auth.uid());

create policy partner_members_insert_admin on public.partner_members
  for insert to authenticated
  with check (public.is_admin());

create policy partner_members_update_admin on public.partner_members
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy partner_members_delete_admin on public.partner_members
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- question_sets
-- ---------------------------------------------------------------------------
alter table public.question_sets enable row level security;

revoke all on public.question_sets from anon, authenticated;
grant select, insert, update, delete on public.question_sets to authenticated;

create policy question_sets_select on public.question_sets
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.partners p
      where p.question_set_id = question_sets.id and public.is_partner_member(p.id)
    )
  );

create policy question_sets_insert_admin on public.question_sets
  for insert to authenticated
  with check (public.is_admin());

create policy question_sets_update_admin on public.question_sets
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy question_sets_delete_admin on public.question_sets
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- question_aspects
-- ---------------------------------------------------------------------------
alter table public.question_aspects enable row level security;

revoke all on public.question_aspects from anon, authenticated;
grant select, insert, update, delete on public.question_aspects to authenticated;

create policy question_aspects_select on public.question_aspects
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.partners p
      where p.question_set_id = question_aspects.question_set_id and public.is_partner_member(p.id)
    )
  );

create policy question_aspects_insert_admin on public.question_aspects
  for insert to authenticated
  with check (public.is_admin());

create policy question_aspects_update_admin on public.question_aspects
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy question_aspects_delete_admin on public.question_aspects
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- submissions
-- Owners get NO select policy on the base table at all — by design, they can
-- only ever reach their own rows through submissions_owner_view below, which
-- strips email/prize_id/winner_id. Admins query the base table directly.
-- ---------------------------------------------------------------------------
alter table public.submissions enable row level security;

revoke all on public.submissions from anon, authenticated;
grant insert on public.submissions to anon;
grant select, update, delete on public.submissions to authenticated;

create policy submissions_insert_anon on public.submissions
  for insert to anon
  with check (true);

create policy submissions_select_admin on public.submissions
  for select to authenticated
  using (public.is_admin());

create policy submissions_update_admin on public.submissions
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy submissions_delete_admin on public.submissions
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- submission_scores (no PII here, so a normal join-based owner policy is fine)
-- ---------------------------------------------------------------------------
alter table public.submission_scores enable row level security;

revoke all on public.submission_scores from anon, authenticated;
grant insert on public.submission_scores to anon;
grant select, update, delete on public.submission_scores to authenticated;

create policy submission_scores_insert_anon on public.submission_scores
  for insert to anon
  with check (true);

create policy submission_scores_select on public.submission_scores
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.submissions s
      where s.id = submission_scores.submission_id and public.is_partner_member(s.partner_id)
    )
  );

create policy submission_scores_update_admin on public.submission_scores
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy submission_scores_delete_admin on public.submission_scores
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- demo_requests
-- ---------------------------------------------------------------------------
alter table public.demo_requests enable row level security;

revoke all on public.demo_requests from anon, authenticated;
grant insert on public.demo_requests to anon, authenticated;
grant select, update, delete on public.demo_requests to authenticated;

create policy demo_requests_insert_public on public.demo_requests
  for insert to anon, authenticated
  with check (true);

create policy demo_requests_select_admin on public.demo_requests
  for select to authenticated
  using (public.is_admin());

create policy demo_requests_update_admin on public.demo_requests
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy demo_requests_delete_admin on public.demo_requests
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- content_settings (marketing copy must be readable by anyone, logged in or not)
-- ---------------------------------------------------------------------------
alter table public.content_settings enable row level security;

revoke all on public.content_settings from anon, authenticated;
grant select on public.content_settings to anon, authenticated;
grant update on public.content_settings to authenticated;

create policy content_settings_select_public on public.content_settings
  for select to anon, authenticated
  using (true);

create policy content_settings_update_admin on public.content_settings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- submissions_owner_view: the only way an owner ever sees submission rows.
-- Created by the migration-running role, so it reads the submissions base
-- table bypassing RLS internally, but the is_partner_member() filter still
-- fully restricts which rows come back for the querying user's session.
-- Deliberately excludes email / prize_id / winner_id.
-- ---------------------------------------------------------------------------
create view public.submissions_owner_view as
select s.id, s.partner_id, s.created_at
from public.submissions s
where public.is_partner_member(s.partner_id);

grant select on public.submissions_owner_view to authenticated;
