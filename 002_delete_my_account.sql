-- Khidmah: "Delete my account" feature
-- Run once in Supabase: SQL Editor > New query > paste > Run
-- It only removes data when a logged-in user taps "Delete my account" for their own account.

-- Bookings keep their history (without the provider link) if a provider leaves
alter table public.bookings alter column provider_id drop not null;
alter table public.bookings drop constraint if exists bookings_provider_id_fkey;
alter table public.bookings add constraint bookings_provider_id_fkey
  foreign key (provider_id) references public.profiles (id) on delete set null;

-- Cancels the user's open bookings, clears their phone from bookings, then removes their login and personal data
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Not logged in'; end if;
  if public.is_admin() then raise exception 'Admin accounts cannot be removed from the app'; end if;
  perform set_config('khidmah.status_change', 'on', true);
  update public.bookings set status = 'Cancelled', status_reason = 'Account closed', customer_phone = null
    where (customer_id = me or provider_id = me) and status in ('Requested','Accepted','On the way','In progress');
  update public.bookings set customer_phone = null where customer_id = me;
  perform set_config('khidmah.status_change', 'off', true);
  delete from auth.users where id = me;
end $$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
