-- Khidmah: map location for bookings and saved addresses
-- Run once in Supabase: SQL Editor > New query > paste all of this > Run
alter table public.bookings  add column if not exists lat double precision;
alter table public.bookings  add column if not exists lng double precision;
alter table public.addresses add column if not exists lat double precision;
alter table public.addresses add column if not exists lng double precision;

alter table public.bookings  drop constraint if exists bookings_latlng_check;
alter table public.bookings  add constraint bookings_latlng_check
  check ((lat is null and lng is null) or (lat between -90 and 90 and lng between -180 and 180));
alter table public.addresses drop constraint if exists addresses_latlng_check;
alter table public.addresses add constraint addresses_latlng_check
  check ((lat is null and lng is null) or (lat between -90 and 90 and lng between -180 and 180));
