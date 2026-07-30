-- Audit findings #6 (second half) and #9.
--
-- #6: prize_draws.submission_id referenced submissions with NO on-delete
-- action. Deleting a partner cascades to its submissions, and that cascade
-- collided with any draw ever recorded for the venue — so deleting a partner
-- that had run even one prize draw failed on a foreign key violation. The
-- application half of this (surfacing the error instead of discarding it) went
-- in with commit 7fc2219; this is the half that makes the delete actually work.
--
-- Cascade is right rather than restrict: a draw is a fact ABOUT a submission
-- and has no meaning once that submission is gone. The admin has already
-- confirmed a destructive delete that explicitly warns every review will go
-- with it; a stray draw row is not a reason to refuse.

alter table public.prize_draws
  drop constraint prize_draws_submission_id_fkey;

alter table public.prize_draws
  add constraint prize_draws_submission_id_fkey
  foreign key (submission_id) references public.submissions (id) on delete cascade;

-- ---------------------------------------------------------------------------
-- #9: winner_id was generated as 'WIN-' + 5 hex characters = 16^5 ≈ 1.05M
-- possible codes, with no uniqueness constraint. By the birthday bound that is
-- roughly a 38% chance of a collision by the 1000th coupon issued — and a
-- collision means two winners holding the same code, which the person at the
-- counter cannot tell apart.
--
-- The application now generates a longer code (see src/app/actions/draw.ts),
-- but generation alone is a convention. These constraints make it an
-- invariant: a collision becomes a failed insert we can retry, not two valid
-- coupons. Both are nullable and Postgres treats NULLs as distinct, so the
-- overwhelming majority of submissions (no prize entry) are unaffected.
-- ---------------------------------------------------------------------------
create unique index submissions_winner_id_key
  on public.submissions (winner_id)
  where winner_id is not null;

create unique index prize_draws_winner_id_key
  on public.prize_draws (winner_id);

-- prize_id is 8 hex characters and only identifies an entry to the guest who
-- holds it; a duplicate there is cosmetic rather than redeemable, so it is
-- deliberately left unconstrained.
