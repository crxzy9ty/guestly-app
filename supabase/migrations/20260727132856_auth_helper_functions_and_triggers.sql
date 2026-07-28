-- security definer helper functions used by RLS policies. Being security definer,
-- they bypass RLS on profiles/partner_members internally, which avoids the classic
-- "RLS policy on profiles recursively queries profiles" infinite-recursion trap.

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create function public.is_partner_member(target_partner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.partner_members
    where partner_id = target_partner_id and user_id = auth.uid()
  );
$$;

-- Generic updated_at maintenance, attached to a few tables below.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.partners
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.question_sets
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.content_settings
  for each row execute function public.set_updated_at();

-- Auto-create a public.profiles row whenever a new auth.users row appears.
-- The role comes from raw_user_meta_data (set at invite/create-user time via
-- the Admin API, e.g. supabase.auth.admin.inviteUserByEmail(email, { data: { role: 'admin' } })),
-- defaulting to 'owner' when absent.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::app_role, 'owner'),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email from going stale if a user's auth email changes later.
create function public.sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.sync_user_email();
