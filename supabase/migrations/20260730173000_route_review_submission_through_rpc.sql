-- Audit findings #4 and #5.
--
-- #5: `anon` held INSERT on submissions and submission_scores with a
-- `with check (true)` policy, and the publishable key that grants `anon` is in
-- every browser bundle. Anyone could POST straight to PostgREST and insert
-- unlimited VALID-looking reviews — correct aspect_key, in-range score —
-- bypassing the server action and its dedup cookie entirely.
--
-- The damage is not mainly skewed averages. `prize_id` and `email` were
-- insertable, so an attacker could enter themselves in the daily draw a
-- thousand times with their own address and win essentially every day. The
-- partner would see a prize draw that appears rigged, which is worse for them
-- than a wrong average.
--
-- Fix: revoke INSERT from anon/authenticated entirely and funnel every
-- submission through submit_guest_review() below, callable only by the
-- service_role key that never leaves our server. The application checks a
-- signed, single-use token before calling it (src/lib/review-token.ts), so a
-- caller must at least have loaded the venue's review page.
--
-- #4: the two inserts were separate statements, described in the code as
-- "atomic" while being nothing of the sort — a failure on the second left a
-- submission with no scores, which still counted toward review totals. They
-- are one function call, and therefore one transaction, here. Length and
-- format limits that only existed in the browser are now database constraints.

-- ---------------------------------------------------------------------------
-- Close the direct path.
-- ---------------------------------------------------------------------------
drop policy submissions_insert_guest on public.submissions;
drop policy submission_scores_insert_guest on public.submission_scores;

revoke insert on public.submissions from anon, authenticated;
revoke insert on public.submission_scores from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Single-use tokens. The nonce from a verified token is stored on the row, so
-- replaying one token is a unique-violation rather than a second review.
-- Nullable because rows created before this migration have none.
-- ---------------------------------------------------------------------------
alter table public.submissions add column request_nonce text;

create unique index submissions_request_nonce_key
  on public.submissions (request_nonce)
  where request_nonce is not null;

-- ---------------------------------------------------------------------------
-- Constraints that previously lived only in the browser, where a direct caller
-- simply ignored them. 500 rather than the textarea's 200: the UI limit can
-- tighten without a migration, but a stored value must never be unbounded.
-- ---------------------------------------------------------------------------
alter table public.submission_scores
  add constraint submission_scores_reason_length
  check (reason is null or length(reason) <= 500);

alter table public.submissions
  add constraint submissions_email_format
  check (email is null or email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

alter table public.submissions
  add constraint submissions_email_length
  check (email is null or length(email) <= 254);

-- ---------------------------------------------------------------------------
-- The one write path for guest reviews. One statement in, one transaction:
-- if any score row is rejected (bad aspect_key via the existing
-- validate_aspect_key trigger, out-of-range value, over-long reason) the
-- submission row goes with it, instead of leaving a scoreless ghost behind.
-- ---------------------------------------------------------------------------
create function public.submit_guest_review(
  p_partner_id uuid,
  p_request_nonce text,
  p_email text,
  p_prize_id text,
  p_prize_consent_at timestamptz,
  p_scores jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission_id uuid := gen_random_uuid();
  v_count integer;
begin
  if p_scores is null or jsonb_typeof(p_scores) <> 'array' or jsonb_array_length(p_scores) = 0 then
    raise exception 'empty-submission' using errcode = '22023';
  end if;

  -- An upper bound as well as a lower one: without it a single call could
  -- insert an unbounded number of score rows for one submission.
  if jsonb_array_length(p_scores) > 50 then
    raise exception 'too-many-scores' using errcode = '22023';
  end if;

  if not exists (select 1 from public.partners where id = p_partner_id) then
    raise exception 'unknown-partner' using errcode = '23503';
  end if;

  insert into public.submissions (id, partner_id, email, prize_id, prize_consent_at, request_nonce)
  values (v_submission_id, p_partner_id, p_email, p_prize_id, p_prize_consent_at, p_request_nonce);

  insert into public.submission_scores (submission_id, aspect_key, score, reason)
  select v_submission_id,
         elem ->> 'aspect_key',
         (elem ->> 'score')::smallint,
         nullif(btrim(coalesce(elem ->> 'reason', '')), '')
  from jsonb_array_elements(p_scores) as elem;

  get diagnostics v_count = row_count;
  if v_count = 0 then
    raise exception 'empty-submission' using errcode = '22023';
  end if;

  return v_submission_id;
end;
$$;

-- service_role only: this function bypasses RLS by design, so exposing it to
-- anon would simply reopen the hole this migration closes.
revoke execute on function public.submit_guest_review(uuid, text, text, text, timestamptz, jsonb)
  from public, anon, authenticated;
grant execute on function public.submit_guest_review(uuid, text, text, text, timestamptz, jsonb)
  to service_role;
