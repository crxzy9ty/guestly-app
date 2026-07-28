-- The guest review page (/ertekeles/[partnerId]) is public/anonymous and needs
-- to read: the venue's name + which question set it uses, and that question
-- set's aspects (labels/icons) — none of this is sensitive. Anon previously
-- had zero access to partners/question_sets/question_aspects.
--
-- partners: only a narrow column subset is exposed via column-level GRANT —
-- address/phone/contact_name/contact_phone/email stay admin+owner-only.

grant select (id, name, question_set_id, alert_threshold) on public.partners to anon;

create policy partners_select_anon on public.partners
  for select to anon
  using (true);

grant select on public.question_sets to anon;

create policy question_sets_select_anon on public.question_sets
  for select to anon
  using (true);

grant select on public.question_aspects to anon;

create policy question_aspects_select_anon on public.question_aspects
  for select to anon
  using (true);
