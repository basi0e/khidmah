-- Khidmah: admin account management
-- Run once in Supabase: SQL Editor > New query > paste all of this > Run
-- Adds admin-only tools to list every login (including unfinished sign-ups),
-- disable/enable an account, and delete an account while keeping booking history.

-- Keep booking history when a provider account is deleted
alter table public.bookings alter column provider_id drop not null;
alter table public.bookings drop constraint if exists bookings_provider_id_fkey;
alter table public.bookings add constraint bookings_provider_id_fkey
  foreign key (provider_id) references public.profiles (id) on delete set null;

-- Every login account, including ones that never finished registration
create or replace function public.admin_list_accounts()
returns table (
  id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz,
  disabled boolean, name text, role text, city text
)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  return query
    select u.id, u.email::text, u.created_at, u.last_sign_in_at,
           coalesce(u.banned_until > now(), false), p.name, p.role, p.city
    from auth.users u
    left join public.profiles p on p.id = u.id
    order by u.created_at desc;
end $$;

-- Block or restore login for an account
create or replace function public.admin_set_disabled(p_user uuid, p_disabled boolean)
returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if p_user = auth.uid() then raise exception 'You cannot disable your own account'; end if;
  if exists (select 1 from public.profiles where id = p_user and role = 'admin') then
    raise exception 'Admin accounts cannot be disabled here';
  end if;
  update auth.users
     set banned_until = case when p_disabled then 'infinity'::timestamptz else null end
   where id = p_user;
  if not found then raise exception 'Account not found'; end if;
  if p_disabled then
    update public.provider_profiles set available = false where user_id = p_user;
    delete from auth.refresh_tokens where user_id = p_user::text;
  end if;
end $$;

-- Remove an account: cancel open bookings, keep history, delete login and profile
create or replace function public.admin_delete_account(p_user uuid)
returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if p_user = auth.uid() then raise exception 'You cannot delete your own account'; end if;
  if exists (select 1 from public.profiles where id = p_user and role = 'admin') then
    raise exception 'Admin accounts cannot be deleted here';
  end if;
  perform set_config('khidmah.status_change', 'on', true);
  update public.bookings
     set status = 'Cancelled', status_reason = 'Account removed by Khidmah'
   where (customer_id = p_user or provider_id = p_user)
     and status in ('Requested','Accepted','On the way','In progress');
  update public.bookings set customer_phone = null where customer_id = p_user;
  perform set_config('khidmah.status_change', 'off', true);
  delete from auth.users where id = p_user;
  if not found then raise exception 'Account not found'; end if;
end $$;

revoke execute on function public.admin_list_accounts() from public, anon;
revoke execute on function public.admin_set_disabled(uuid, boolean) from public, anon;
revoke execute on function public.admin_delete_account(uuid) from public, anon;
grant execute on function public.admin_list_accounts() to authenticated;
grant execute on function public.admin_set_disabled(uuid, boolean) to authenticated;
grant execute on function public.admin_delete_account(uuid) to authenticated;
