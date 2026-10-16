-- =====================================================================
-- Khidmah database: tables, security rules and booking functions
-- Run once in Supabase: Dashboard > SQL Editor > New query > paste > Run
-- Safe to read top to bottom; every section is commented.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Small helpers
-- ---------------------------------------------------------------------
-- Booking numbers like KH-10001
create sequence if not exists booking_ref_seq start 10001;
create sequence if not exists ticket_ref_seq start 1001;

-- ---------------------------------------------------------------------
-- 1. People
-- ---------------------------------------------------------------------
-- One row per person. The WhatsApp number itself lives in Supabase's
-- auth.users table (phone login), so it is never exposed by this table.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null default 'customer' check (role in ('customer','provider','admin')),
  name        text not null check (char_length(name) between 2 and 80),
  city        text not null default 'Riyadh' check (city in ('Riyadh','Dammam')),
  created_at  timestamptz not null default now()
);

-- Extra details for service providers and room owners
create table if not exists public.provider_profiles (
  user_id         uuid primary key references public.profiles (id) on delete cascade,
  provider_type   text not null check (provider_type in ('Individual technician','Company','Landlord / room owner')),
  services        text[] not null default '{}',
  price_from      numeric(10,2) not null check (price_from >= 10),
  experience      text,
  about           text check (char_length(about) <= 600),
  districts       text[] not null default '{}',
  work_days       int[]  not null default '{6,0,1,2,3,4}',   -- 0 = Sunday ... 6 = Saturday
  work_from       time   not null default '08:00',
  work_to         time   not null default '22:00',
  languages       text[] not null default '{Arabic,English}',
  vat_registered  boolean not null default false,
  available       boolean not null default true,
  status          text not null default 'Pending verification'
                  check (status in ('Pending verification','Under review','Verified','Rejected')),
  reject_reason   text,
  updated_at      timestamptz not null default now()
);

create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  label       text not null default 'Home',
  district    text not null,
  detail      text not null check (char_length(detail) between 3 and 200),
  created_at  timestamptz not null default now()
);

create table if not exists public.favorites (
  customer_id  uuid not null references public.profiles (id) on delete cascade,
  provider_id  uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (customer_id, provider_id)
);

-- ---------------------------------------------------------------------
-- 2. Bookings and everything attached to them
-- ---------------------------------------------------------------------
create table if not exists public.bookings (
  id             uuid primary key default gen_random_uuid(),
  ref            text not null unique default ('KH-' || nextval('booking_ref_seq')),
  category       text not null,
  kind           text not null default 'service' check (kind in ('service','room')),
  service        text not null,
  customer_id    uuid references public.profiles (id) on delete set null,
  provider_id    uuid not null references public.profiles (id) on delete restrict,
  city           text not null,
  district       text not null,
  address        text,
  note           text check (char_length(note) <= 1000),
  visit_date     date not null,
  visit_slot     text not null,          -- 'Morning (8 am - 12 pm)', 'As soon as possible' ...
  urgent         boolean not null default false,
  price_from     numeric(10,2),
  rent           numeric(10,2),
  pay_method     text not null default 'Cash' check (pay_method in ('Cash','mada card','Apple Pay','STC Pay','Monthly rent')),
  status         text not null default 'Requested'
                 check (status in ('Requested','Accepted','On the way','In progress','Completed','Declined','Cancelled')),
  status_reason  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists bookings_customer_idx on public.bookings (customer_id, created_at desc);
create index if not exists bookings_provider_idx on public.bookings (provider_id, status, created_at desc);

-- Every status change, for the timeline
create table if not exists public.booking_events (
  id          bigint generated always as identity primary key,
  booking_id  uuid not null references public.bookings (id) on delete cascade,
  status      text not null,
  note        text,
  by_user     uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists booking_events_booking_idx on public.booking_events (booking_id, created_at);

-- Chat. sender_id is null for system lines ("Booking requested").
create table if not exists public.messages (
  id          bigint generated always as identity primary key,
  booking_id  uuid not null references public.bookings (id) on delete cascade,
  sender_id   uuid references public.profiles (id) on delete set null,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);
create index if not exists messages_booking_idx on public.messages (booking_id, created_at);

-- The provider's bill when the job is finished
create table if not exists public.bills (
  booking_id   uuid primary key references public.bookings (id) on delete cascade,
  labour       numeric(10,2) not null check (labour >= 0),
  parts        numeric(10,2) not null default 0 check (parts >= 0),
  parts_note   text,
  vat_applied  boolean not null default false,
  vat_amount   numeric(10,2) generated always as (case when vat_applied then round((labour + parts) * 0.15, 2) else 0 end) stored,
  total        numeric(10,2) generated always as (labour + parts + case when vat_applied then round((labour + parts) * 0.15, 2) else 0 end) stored,
  paid_method  text not null,
  created_at   timestamptz not null default now()
);

create table if not exists public.reviews (
  booking_id   uuid primary key references public.bookings (id) on delete cascade,
  provider_id  uuid not null references public.profiles (id) on delete cascade,
  customer_name text not null,
  stars        int not null check (stars between 1 and 5),
  body         text check (char_length(body) <= 1000),
  reply        text check (char_length(reply) <= 1000),
  created_at   timestamptz not null default now()
);
create index if not exists reviews_provider_idx on public.reviews (provider_id, created_at desc);

-- ---------------------------------------------------------------------
-- 3. Verification documents, notifications, support
-- ---------------------------------------------------------------------
-- The files themselves go in the private storage bucket 'provider-docs'
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references public.profiles (id) on delete cascade,
  doc_type     text not null,
  file_path    text not null,           -- path inside the 'provider-docs' bucket
  file_name    text not null,
  uploaded_at  timestamptz not null default now()
);

create table if not exists public.notifications (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  body        text not null,
  booking_id  uuid references public.bookings (id) on delete cascade,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

create table if not exists public.tickets (
  id          uuid primary key default gen_random_uuid(),
  ref         text not null unique default ('T-' || nextval('ticket_ref_seq')),
  user_id     uuid references public.profiles (id) on delete set null,
  booking_id  uuid references public.bookings (id) on delete set null,
  subject     text not null,
  body        text not null check (char_length(body) between 5 and 3000),
  status      text not null default 'Open' check (status in ('Open','Resolved')),
  created_at  timestamptz not null default now()
);

create table if not exists public.ticket_replies (
  id          bigint generated always as identity primary key,
  ticket_id   uuid not null references public.tickets (id) on delete cascade,
  author_id   uuid references public.profiles (id) on delete set null,
  body        text not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. Who is asking? (used by the security rules)
-- ---------------------------------------------------------------------
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_party(b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.bookings
                 where id = b and (customer_id = auth.uid() or provider_id = auth.uid()))
$$;

-- ---------------------------------------------------------------------
-- 5. Row-level security: the database refuses anything not listed here
-- ---------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.provider_profiles enable row level security;
alter table public.addresses         enable row level security;
alter table public.favorites         enable row level security;
alter table public.bookings          enable row level security;
alter table public.booking_events    enable row level security;
alter table public.messages          enable row level security;
alter table public.bills             enable row level security;
alter table public.reviews           enable row level security;
alter table public.documents         enable row level security;
alter table public.notifications     enable row level security;
alter table public.tickets           enable row level security;
alter table public.ticket_replies    enable row level security;

-- profiles: see yourself, providers (public names), the other side of your bookings; admins see all
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid() or role = 'provider' or public.is_admin()
  or exists (select 1 from public.bookings b where (b.customer_id = auth.uid() and b.provider_id = profiles.id)
                                              or (b.provider_id = auth.uid() and b.customer_id = profiles.id))
);
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = auth.uid() and role in ('customer','provider'));   -- nobody makes themselves admin
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- provider_profiles: anyone logged in can browse providers who aren't rejected
drop policy if exists pp_select on public.provider_profiles;
create policy pp_select on public.provider_profiles for select to authenticated
  using (status <> 'Rejected' or user_id = auth.uid() or public.is_admin());
drop policy if exists pp_insert on public.provider_profiles;
create policy pp_insert on public.provider_profiles for insert to authenticated
  with check (user_id = auth.uid() and public.my_role() = 'provider' and status = 'Pending verification');
drop policy if exists pp_update on public.provider_profiles;
create policy pp_update on public.provider_profiles for update to authenticated
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

-- Providers may not verify themselves: only admins change status beyond 'Under review'
create or replace function public.guard_provider_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and not public.is_admin() then
    if not (old.status in ('Pending verification','Rejected') and new.status = 'Under review') then
      raise exception 'Only Khidmah admins can change verification status';
    end if;
  end if;
  if new.reject_reason is distinct from old.reject_reason and not public.is_admin() then
    new.reject_reason := old.reject_reason;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists provider_status_guard on public.provider_profiles;
create trigger provider_status_guard before update on public.provider_profiles
  for each row execute function public.guard_provider_status();

-- addresses and favorites: your own only
drop policy if exists addr_all on public.addresses;
create policy addr_all on public.addresses for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists fav_all on public.favorites;
create policy fav_all on public.favorites for all to authenticated
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());

-- bookings: customer and provider see their own, admins see all.
-- Customers create bookings; status changes go only through set_booking_status() below.
drop policy if exists bk_select on public.bookings;
create policy bk_select on public.bookings for select to authenticated
  using (customer_id = auth.uid() or provider_id = auth.uid() or public.is_admin());
drop policy if exists bk_insert on public.bookings;
create policy bk_insert on public.bookings for insert to authenticated
  with check (customer_id = auth.uid() and status = 'Requested' and public.my_role() = 'customer'
              and exists (select 1 from public.provider_profiles p
                          where p.user_id = provider_id and p.available and p.status <> 'Rejected'));
-- Customers may only change the time of a booking that hasn't started
drop policy if exists bk_update_resched on public.bookings;
create policy bk_update_resched on public.bookings for update to authenticated
  using (customer_id = auth.uid() and status in ('Requested','Accepted'))
  with check (customer_id = auth.uid());

create or replace function public.guard_booking_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- When called through set_booking_status the flag is set; otherwise only date/slot may change
  if coalesce(current_setting('khidmah.status_change', true), '') <> 'on' and not public.is_admin() then
    if (new.status, new.status_reason, new.provider_id, new.customer_id, new.price_from, new.rent, new.service, new.category, new.ref)
       is distinct from (old.status, old.status_reason, old.provider_id, old.customer_id, old.price_from, old.rent, old.service, old.category, old.ref) then
      raise exception 'Use the app actions to change a booking';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists booking_update_guard on public.bookings;
create trigger booking_update_guard before update on public.bookings
  for each row execute function public.guard_booking_update();

-- timeline, chat, bills: only the two people on the booking (and admins)
drop policy if exists ev_select on public.booking_events;
create policy ev_select on public.booking_events for select to authenticated
  using (public.is_party(booking_id) or public.is_admin());

drop policy if exists msg_select on public.messages;
create policy msg_select on public.messages for select to authenticated
  using (public.is_party(booking_id) or public.is_admin());
drop policy if exists msg_insert on public.messages;
create policy msg_insert on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_party(booking_id)
              and exists (select 1 from public.bookings b where b.id = booking_id and b.status not in ('Cancelled','Declined')));

drop policy if exists bill_select on public.bills;
create policy bill_select on public.bills for select to authenticated
  using (public.is_party(booking_id) or public.is_admin());

-- reviews: public to logged-in users; written by the customer after completion; reply by the provider
drop policy if exists rev_select on public.reviews;
create policy rev_select on public.reviews for select to authenticated using (true);
drop policy if exists rev_insert on public.reviews;
create policy rev_insert on public.reviews for insert to authenticated with check (
  exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid()
          and b.status = 'Completed' and b.provider_id = reviews.provider_id)
);
drop policy if exists rev_reply on public.reviews;
create policy rev_reply on public.reviews for update to authenticated
  using (provider_id = auth.uid()) with check (provider_id = auth.uid());

-- The reviewer's name always comes from their profile
create or replace function public.before_review_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select name into new.customer_name from public.profiles where id = auth.uid();
  new.reply := null;
  return new;
end $$;
drop trigger if exists review_before_insert on public.reviews;
create trigger review_before_insert before insert on public.reviews
  for each row execute function public.before_review_insert();

create or replace function public.guard_review_update() returns trigger
language plpgsql as $$
begin
  if (new.stars, new.body, new.booking_id, new.provider_id) is distinct from (old.stars, old.body, old.booking_id, old.provider_id) then
    raise exception 'Providers can only add a reply to a review';
  end if;
  return new;
end $$;
drop trigger if exists review_update_guard on public.reviews;
create trigger review_update_guard before update on public.reviews
  for each row execute function public.guard_review_update();

-- documents: provider sees and adds their own; admins see all
drop policy if exists doc_select on public.documents;
create policy doc_select on public.documents for select to authenticated
  using (provider_id = auth.uid() or public.is_admin());
drop policy if exists doc_insert on public.documents;
create policy doc_insert on public.documents for insert to authenticated
  with check (provider_id = auth.uid());
drop policy if exists doc_delete on public.documents;
create policy doc_delete on public.documents for delete to authenticated
  using (provider_id = auth.uid());

-- notifications: your own; you can mark them read
drop policy if exists notif_select on public.notifications;
create policy notif_select on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists notif_update on public.notifications;
create policy notif_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- tickets: your own, admins all
drop policy if exists t_select on public.tickets;
create policy t_select on public.tickets for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists t_insert on public.tickets;
create policy t_insert on public.tickets for insert to authenticated
  with check (user_id = auth.uid() and status = 'Open' and (booking_id is null or public.is_party(booking_id)));
drop policy if exists t_update on public.tickets;
create policy t_update on public.tickets for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists tr_select on public.ticket_replies;
create policy tr_select on public.ticket_replies for select to authenticated
  using (public.is_admin() or exists (select 1 from public.tickets t where t.id = ticket_id and t.user_id = auth.uid()));
drop policy if exists tr_insert on public.ticket_replies;
create policy tr_insert on public.ticket_replies for insert to authenticated
  with check (author_id = auth.uid() and public.is_admin());

-- ---------------------------------------------------------------------
-- 6. App actions (the only way bookings move forward)
-- ---------------------------------------------------------------------
create or replace function public.notify(u uuid, msg text, b uuid default null) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, body, booking_id) select u, msg, b where u is not null
$$;

-- Before a booking is saved: take the price from the provider's profile, not from the app
create or replace function public.before_booking_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.kind = 'service' then
    select price_from into new.price_from from public.provider_profiles where user_id = new.provider_id;
  end if;
  new.status := 'Requested';
  return new;
end $$;
drop trigger if exists booking_before_insert on public.bookings;
create trigger booking_before_insert before insert on public.bookings
  for each row execute function public.before_booking_insert();

-- When a booking is created: first timeline entry, system chat line, alert to the provider
create or replace function public.on_booking_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.booking_events (booking_id, status, by_user) values (new.id, 'Requested', new.customer_id);
  insert into public.messages (booking_id, sender_id, body)
    values (new.id, null, case when new.urgent then 'Urgent booking requested' else 'Booking requested' end);
  perform public.notify(new.provider_id,
    'New ' || case when new.urgent then 'urgent ' else '' end || 'booking request: ' || new.service || ' (' || new.ref || ')', new.id);
  return new;
end $$;
drop trigger if exists booking_created on public.bookings;
create trigger booking_created after insert on public.bookings
  for each row execute function public.on_booking_created();

-- Move a booking to a new status, checking who is allowed to do what
create or replace function public.set_booking_status(p_booking uuid, p_status text, p_reason text default null)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  b public.bookings;
  me uuid := auth.uid();
  allowed boolean := false;
  who text;
begin
  select * into b from public.bookings where id = p_booking for update;
  if not found then raise exception 'Booking not found'; end if;

  if me = b.provider_id then
    who := 'provider';
    allowed := (b.status = 'Requested'   and p_status in ('Accepted','Declined'))
            or (b.status = 'Accepted'    and p_status in ('On the way','Cancelled'))
            or (b.status = 'On the way'  and p_status in ('In progress','Cancelled'))
            or (b.kind = 'room' and b.status = 'Accepted' and p_status = 'Completed');
  elsif me = b.customer_id then
    who := 'customer';
    allowed := b.status in ('Requested','Accepted') and p_status = 'Cancelled';
  elsif public.is_admin() then
    who := 'admin';
    allowed := b.status in ('Requested','Accepted','On the way','In progress') and p_status = 'Cancelled';
  end if;

  if not allowed then
    raise exception 'Not allowed: % cannot move booking from % to %', coalesce(who,'this user'), b.status, p_status;
  end if;

  perform set_config('khidmah.status_change', 'on', true);
  update public.bookings set status = p_status, status_reason = coalesce(p_reason, status_reason) where id = p_booking returning * into b;
  perform set_config('khidmah.status_change', 'off', true);

  insert into public.booking_events (booking_id, status, note, by_user) values (b.id, p_status, p_reason, me);
  insert into public.messages (booking_id, sender_id, body) values (b.id, null,
    case p_status
      when 'Accepted'    then 'Booking accepted'
      when 'On the way'  then 'Provider is on the way'
      when 'In progress' then 'Job started'
      when 'Completed'   then 'Viewing completed'
      when 'Declined'    then 'Declined by provider'
      when 'Cancelled'   then 'Cancelled by ' || who
    end);

  if who = 'customer' then
    perform public.notify(b.provider_id, 'Booking ' || b.ref || ' was cancelled by the customer', b.id);
  else
    perform public.notify(b.customer_id, 'Booking ' || b.ref || ': ' || lower(p_status), b.id);
    if who = 'admin' then perform public.notify(b.provider_id, 'Booking ' || b.ref || ' was cancelled by Khidmah support', b.id); end if;
  end if;
  return b;
end $$;

-- Provider finishes a service job and records the bill in one step
create or replace function public.complete_job(p_booking uuid, p_labour numeric, p_parts numeric, p_parts_note text,
                                               p_vat boolean, p_paid text)
returns public.bills
language plpgsql security definer set search_path = public as $$
declare b public.bookings; bill public.bills;
begin
  select * into b from public.bookings where id = p_booking for update;
  if not found or b.provider_id <> auth.uid() then raise exception 'Not your booking'; end if;
  if b.status <> 'In progress' then raise exception 'Start the job before finishing it'; end if;

  insert into public.bills (booking_id, labour, parts, parts_note, vat_applied, paid_method)
    values (b.id, p_labour, coalesce(p_parts,0), p_parts_note, p_vat, p_paid) returning * into bill;

  perform set_config('khidmah.status_change', 'on', true);
  update public.bookings set status = 'Completed' where id = b.id;
  perform set_config('khidmah.status_change', 'off', true);

  insert into public.booking_events (booking_id, status, by_user) values (b.id, 'Completed', auth.uid());
  insert into public.messages (booking_id, sender_id, body) values (b.id, null, 'Job completed. Receipt sent');
  perform public.notify(b.customer_id, 'Job completed. Total SAR ' || bill.total || '. Please rate your provider (' || b.ref || ')', b.id);
  return bill;
end $$;

-- A phone number is shared only once the provider has accepted
create or replace function public.get_contact_phone(p_booking uuid) returns text
language plpgsql stable security definer set search_path = public, auth as $$
declare b public.bookings; other uuid;
begin
  select * into b from public.bookings where id = p_booking;
  if not found then return null; end if;
  if b.status not in ('Accepted','On the way','In progress','Completed') and not public.is_admin() then return null; end if;
  if auth.uid() = b.customer_id then other := b.provider_id;
  elsif auth.uid() = b.provider_id then other := b.customer_id;
  elsif public.is_admin() then other := b.customer_id;
  else return null; end if;
  return (select phone from auth.users where id = other);
end $$;

-- Alert the other side of a chat
create or replace function public.on_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare b public.bookings; sender_name text;
begin
  if new.sender_id is null then return new; end if;
  select * into b from public.bookings where id = new.booking_id;
  select name into sender_name from public.profiles where id = new.sender_id;
  perform public.notify(case when new.sender_id = b.customer_id then b.provider_id else b.customer_id end,
                        'New message from ' || split_part(sender_name, ' ', 1) || ' (' || b.ref || ')', b.id);
  return new;
end $$;
drop trigger if exists message_created on public.messages;
create trigger message_created after insert on public.messages
  for each row execute function public.on_message();

-- Completed jobs per provider (counted without exposing other people's bookings)
create or replace function public.provider_jobs_done(p uuid) returns bigint
language sql stable security definer set search_path = public as $$
  select count(*) from public.bookings where provider_id = p and status = 'Completed'
$$;

-- Public provider listing with live rating and job count
create or replace view public.provider_cards with (security_invoker = true) as
select p.id, p.name, p.city, pp.provider_type, pp.services, pp.price_from, pp.experience, pp.about,
       pp.districts, pp.work_days, pp.work_from, pp.work_to, pp.languages, pp.available,
       (pp.status = 'Verified') as verified,
       coalesce(r.avg_stars, 0)::numeric(3,1) as rating, coalesce(r.n, 0) as review_count,
       public.provider_jobs_done(p.id) as jobs_done
from public.profiles p
join public.provider_profiles pp on pp.user_id = p.id
left join (select provider_id, avg(stars) avg_stars, count(*) n from public.reviews group by provider_id) r on r.provider_id = p.id
where p.role = 'provider' and pp.status <> 'Rejected';

-- ---------------------------------------------------------------------
-- 7. Private storage for verification documents
-- ---------------------------------------------------------------------
-- Files are stored as provider-docs/<provider user id>/<file name>
insert into storage.buckets (id, name, public) values ('provider-docs', 'provider-docs', false)
on conflict (id) do nothing;

drop policy if exists "providers upload own docs" on storage.objects;
create policy "providers upload own docs" on storage.objects for insert to authenticated
  with check (bucket_id = 'provider-docs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "providers and admins read docs" on storage.objects;
create policy "providers and admins read docs" on storage.objects for select to authenticated
  using (bucket_id = 'provider-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
drop policy if exists "providers delete own docs" on storage.objects;
create policy "providers delete own docs" on storage.objects for delete to authenticated
  using (bucket_id = 'provider-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- 8. Live updates for chat, bookings and notifications
-- ---------------------------------------------------------------------
do $$ begin
  begin alter publication supabase_realtime add table public.messages;      exception when others then null; end;
  begin alter publication supabase_realtime add table public.bookings;      exception when others then null; end;
  begin alter publication supabase_realtime add table public.notifications; exception when others then null; end;
end $$;

-- ---------------------------------------------------------------------
-- 9. Make yourself admin (run separately AFTER you have logged in once)
-- ---------------------------------------------------------------------
-- update public.profiles set role = 'admin' where id = (select id from auth.users where phone = '9665XXXXXXXX');
