-- The guest review page (/ertekeles/[partnerId]) is anonymous and, since the
-- prize-frequency feature, selects partners.prize_frequency and
-- prize_description to render the correct prize copy — but the anon
-- column-level grant from 20260727164654_guest_review_read_access.sql was
-- never extended to cover them. Postgres silently returns no row for a
-- select naming a column the role has no grant on, so every real,
-- logged-out guest has been seeing "Ez a link nem érvényes" since that
-- feature shipped — it only looked fine in testing because the browser used
-- for it also had an admin session, whose RLS access covers every column.
grant select (prize_frequency, prize_description) on public.partners to anon;
