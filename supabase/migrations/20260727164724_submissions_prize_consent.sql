-- Explicit, timestamped consent for the prize-draw email, so there is a real
-- record of when (and that) the guest opted in — not just the presence of an
-- email address. Nullable: null means no prize entry / no consent given.

alter table public.submissions add column prize_consent_at timestamptz;
