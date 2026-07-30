-- Caps how many times one email address can enter one venue's daily draw.
--
-- The token in src/lib/review-token.ts made scripted submission slower, not
-- impossible: a loop that fetches the review page before each post still
-- works. What that loop is FOR, though, is the prize — enter yourself a
-- thousand times and you win essentially every day. Removing the payoff is a
-- better answer than trying to outrun the loop, because it does not depend on
-- guessing a rate that separates an attacker from a busy Friday night.
--
-- Two per address per venue per Budapest day: someone genuinely turning up
-- twice in a day (morning coffee, evening meal) is ordinary; a third is not,
-- and one thousand is the thing this exists to stop.
--
-- The review itself is always kept. Rejecting the third submission outright
-- would lose real feedback from a real guest on a real third visit — the exact
-- data the product exists to collect — while costing an attacker nothing they
-- care about. Only the prize entry is dropped.

create index if not exists idx_submissions_partner_email
  on public.submissions (partner_id, email)
  where email is not null;

-- Return type changes, so the old signature has to go first.
drop function if exists public.submit_guest_review(uuid, text, text, text, timestamptz, jsonb);

create function public.submit_guest_review(
  p_partner_id uuid,
  p_request_nonce text,
  p_email text,
  p_prize_id text,
  p_prize_consent_at timestamptz,
  p_scores jsonb
)
returns table (submission_id uuid, prize_entered boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission_id uuid := gen_random_uuid();
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_prize_entered boolean := v_email is not null;
  v_today date := (now() at time zone 'Europe/Budapest')::date;
  v_entries_today integer;
  v_count integer;
begin
  if p_scores is null or jsonb_typeof(p_scores) <> 'array' or jsonb_array_length(p_scores) = 0 then
    raise exception 'empty-submission' using errcode = '22023';
  end if;

  if jsonb_array_length(p_scores) > 50 then
    raise exception 'too-many-scores' using errcode = '22023';
  end if;

  if not exists (select 1 from public.partners where id = p_partner_id) then
    raise exception 'unknown-partner' using errcode = '23503';
  end if;

  if v_prize_entered then
    -- Serialises concurrent inserts for this (venue, address) pair, so the
    -- count below cannot be read stale. Without it, submissions fired in
    -- parallel would each see the same low count and all pass — which is
    -- exactly how a script would attack a plain count check.
    perform pg_advisory_xact_lock(hashtextextended(p_partner_id::text || '|' || v_email, 0));

    select count(*) into v_entries_today
    from public.submissions s
    where s.partner_id = p_partner_id
      and s.email = v_email
      and (s.created_at at time zone 'Europe/Budapest')::date = v_today;

    if v_entries_today >= 2 then
      v_prize_entered := false;
    end if;
  end if;

  insert into public.submissions (id, partner_id, email, prize_id, prize_consent_at, request_nonce)
  values (
    v_submission_id,
    p_partner_id,
    case when v_prize_entered then v_email end,
    case when v_prize_entered then p_prize_id end,
    case when v_prize_entered then p_prize_consent_at end,
    p_request_nonce
  );

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

  return query select v_submission_id, v_prize_entered;
end;
$$;

revoke execute on function public.submit_guest_review(uuid, text, text, text, timestamptz, jsonb)
  from public, anon, authenticated;
grant execute on function public.submit_guest_review(uuid, text, text, text, timestamptz, jsonb)
  to service_role;
