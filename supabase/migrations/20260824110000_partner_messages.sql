-- One-way inbox: a partner owner writes a note from their dashboard, the
-- admin reads it in Beállítások → Üzenetek and marks it read. No reply
-- thread — if that's ever needed, it's a separate feature.
create table public.partner_messages (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  -- set null (not cascade-delete) so a message survives the sender's account
  -- being removed later — the admin still sees what was said, just not by whom.
  sender_user_id uuid references public.profiles (id) on delete set null,
  message text not null check (char_length(message) between 1 and 2000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_partner_messages_partner_id on public.partner_messages (partner_id);
create index idx_partner_messages_created_at on public.partner_messages (created_at desc);

alter table public.partner_messages enable row level security;

revoke all on public.partner_messages from anon, authenticated;
grant select, insert on public.partner_messages to authenticated;
grant update on public.partner_messages to authenticated;

-- Any member of the venue can see the venue's message history (it's a shared
-- inbox per partner, not per individual owner-user), same generosity as
-- partners_select.
create policy partner_messages_select on public.partner_messages
  for select to authenticated
  using (public.is_admin() or public.is_partner_member(partner_id));

create policy partner_messages_insert_owner on public.partner_messages
  for insert to authenticated
  with check (public.is_partner_member(partner_id) and sender_user_id = auth.uid());

-- Only the admin flips is_read — an owner re-reading their own sent message
-- has no reason to touch this table.
create policy partner_messages_update_admin on public.partner_messages
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
