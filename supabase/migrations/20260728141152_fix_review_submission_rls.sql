-- Code-review fixes for the guest review submission path.
--
-- Bug #2: submissions/submission_scores only granted INSERT to `anon`. Any
-- caller with an active Supabase session (an owner or admin testing their own
-- QR code, or a returning guest who happens to be logged in for some future
-- feature) hits PostgREST as `authenticated`, which had no INSERT grant at
-- all, so the very last step of the guest flow failed for them with a
-- generic error. Fix: grant INSERT to `authenticated` too, and widen both
-- INSERT policies from `to anon` to `to anon, authenticated`.
--
-- Bug #5: both grants were table-wide (all columns), and the INSERT policies
-- were `with check (true)`, so anyone with the publishable key could
-- `POST /rest/v1/submissions` directly (bypassing src/app/actions/reviews.ts
-- entirely) and set `winner_id` (self-declare a prize win) or backdate
-- `created_at` (poison the heatmap). Fix: column-level GRANTs listing only
-- the columns our own insert path actually needs — `created_at` and
-- `winner_id` are simply not grantable to insert into, at the database
-- level, regardless of what any application code does.
--
-- Also: submission_scores accepted any `aspect_key` string for any
-- `submission_id`, with no check that the key belongs to that submission's
-- partner's actual question set. A validation trigger closes that
-- independently of which path performs the insert.

-- ---------------------------------------------------------------------------
-- submissions
-- ---------------------------------------------------------------------------
drop policy submissions_insert_anon on public.submissions;

revoke insert on public.submissions from anon, authenticated;
grant insert (id, partner_id, email, prize_id, prize_consent_at, dedup_token) on public.submissions to anon, authenticated;

create policy submissions_insert_guest on public.submissions
  for insert to anon, authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- submission_scores
-- ---------------------------------------------------------------------------
drop policy submission_scores_insert_anon on public.submission_scores;

revoke insert on public.submission_scores from anon, authenticated;
grant insert (submission_id, aspect_key, score, reason) on public.submission_scores to anon, authenticated;

create policy submission_scores_insert_guest on public.submission_scores
  for insert to anon, authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- aspect_key validation: reject any insert whose aspect_key doesn't belong
-- to the submission's partner's current question set.
-- ---------------------------------------------------------------------------
create function public.validate_submission_score_aspect()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_valid boolean;
begin
  select exists (
    select 1
    from public.submissions s
    join public.partners p on p.id = s.partner_id
    join public.question_aspects qa on qa.question_set_id = p.question_set_id
    where s.id = new.submission_id and qa.key = new.aspect_key
  ) into v_valid;

  if not v_valid then
    raise exception 'invalid aspect_key "%" for submission %', new.aspect_key, new.submission_id;
  end if;

  return new;
end;
$$;

create trigger validate_aspect_key
  before insert on public.submission_scores
  for each row execute function public.validate_submission_score_aspect();
