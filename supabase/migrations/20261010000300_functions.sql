-- =============================================================================
-- Lingora: business logic (RPC functions and triggers)
--
-- All state transitions that need integrity guarantees (bookings, reviews
-- aggregates, conversations) happen here, inside single transactions, so the
-- rules hold no matter which client calls the API.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tutor search (SECURITY INVOKER: RLS still applies, approved tutors only)
-- -----------------------------------------------------------------------------
create or replace function public.search_tutors(
  p_query       text default null,
  p_teaches     text default null,
  p_native      text default null,
  p_country     text default null,
  p_level       public.cefr_level default null,
  p_specialty   text default null,
  p_min_price   integer default null,
  p_max_price   integer default null,
  p_min_rating  numeric default null,
  p_sort        text default 'recommended',
  p_limit       integer default 12,
  p_offset      integer default 0
)
returns table (
  id                uuid,
  full_name         text,
  avatar_url        text,
  country           text,
  headline          text,
  about             text,
  specialties       text[],
  levels_taught     public.cefr_level[],
  hourly_rate_cents integer,
  currency          text,
  lesson_durations  integer[],
  avg_rating        numeric,
  review_count      integer,
  completed_lessons integer,
  is_demo           boolean,
  languages         jsonb,
  total_count       bigint
)
language sql
stable
set search_path = ''
as $$
  with filtered as (
    select tp.*, p.full_name, p.avatar_url, p.country
    from public.tutor_profiles tp
    join public.profiles p on p.id = tp.id
    where tp.status = 'approved'
      and p.role = 'tutor'
      and not p.is_suspended
      and (p_query is null or p.full_name ilike '%' || replace(replace(p_query, '%', ''), '_', '') || '%'
           or tp.headline ilike '%' || replace(replace(p_query, '%', ''), '_', '') || '%')
      and (p_teaches is null or exists (
            select 1 from public.tutor_languages tl
            where tl.tutor_id = tp.id and tl.language_code = p_teaches and tl.teaches))
      and (p_native is null or exists (
            select 1 from public.tutor_languages tl
            where tl.tutor_id = tp.id and tl.language_code = p_native and tl.is_native))
      and (p_country is null or p.country = p_country)
      and (p_level is null or p_level = any (tp.levels_taught))
      and (p_specialty is null or p_specialty = any (tp.specialties))
      and (p_min_price is null or tp.hourly_rate_cents >= p_min_price)
      and (p_max_price is null or tp.hourly_rate_cents <= p_max_price)
      and (p_min_rating is null or (tp.review_count > 0 and tp.avg_rating >= p_min_rating))
  )
  select
    f.id, f.full_name, f.avatar_url, f.country, f.headline, left(f.about, 280),
    f.specialties, f.levels_taught, f.hourly_rate_cents, f.currency, f.lesson_durations,
    f.avg_rating, f.review_count, f.completed_lessons, f.is_demo,
    coalesce((
      select jsonb_agg(jsonb_build_object(
               'code', tl.language_code, 'name', l.name, 'teaches', tl.teaches,
               'is_native', tl.is_native, 'proficiency', tl.proficiency)
             order by tl.is_native desc, l.sort_order)
      from public.tutor_languages tl
      join public.languages l on l.code = tl.language_code
      where tl.tutor_id = f.id
    ), '[]'::jsonb),
    count(*) over ()
  from filtered f
  order by
    case when p_sort = 'price_asc'  then f.hourly_rate_cents end asc,
    case when p_sort = 'price_desc' then f.hourly_rate_cents end desc,
    case when p_sort in ('rating', 'recommended') then f.avg_rating end desc,
    f.review_count desc,
    f.is_demo asc,
    f.created_at desc
  limit least(greatest(coalesce(p_limit, 12), 1), 48)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

-- -----------------------------------------------------------------------------
-- Published reviews for a tutor. Reviewer identity is reduced to a display
-- name (first name + initial); student profiles are otherwise private.
-- -----------------------------------------------------------------------------
create or replace function public.get_tutor_reviews(
  p_tutor_id uuid, p_limit integer default 10, p_offset integer default 0
)
returns table (
  id            uuid,
  rating        smallint,
  comment       text,
  created_at    timestamptz,
  reviewer_name text,
  lesson_type   public.lesson_type,
  total_count   bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id, r.rating, r.comment, r.created_at,
    coalesce(
      nullif(split_part(btrim(p.full_name), ' ', 1), '') ||
        case when split_part(btrim(p.full_name), ' ', 2) <> ''
             then ' ' || left(split_part(btrim(p.full_name), ' ', 2), 1) || '.' else '' end,
      'Student'
    ),
    b.lesson_type,
    count(*) over ()
  from public.reviews r
  join public.bookings b on b.id = r.booking_id and b.status = 'completed'
  join public.profiles p on p.id = r.student_id
  join public.tutor_profiles tp on tp.id = r.tutor_id
  where r.tutor_id = p_tutor_id
    and r.status = 'published'
    and (tp.status = 'approved' or tp.id = (select auth.uid()) or public.is_admin())
  order by r.created_at desc
  limit least(greatest(coalesce(p_limit, 10), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

-- -----------------------------------------------------------------------------
-- Bookable slots for a tutor, computed from weekly availability in the
-- tutor's time zone, minus time off and active bookings. Only start times are
-- returned, never who booked what.
-- -----------------------------------------------------------------------------
create or replace function public.get_tutor_slots(
  p_tutor_id       uuid,
  p_from           timestamptz,
  p_to             timestamptz,
  p_duration       integer,
  p_ignore_booking uuid default null
)
returns table (starts_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tz        text;
  v_durations integer[];
  v_from      timestamptz;
  v_to        timestamptz;
begin
  select p.timezone, tp.lesson_durations
    into v_tz, v_durations
  from public.tutor_profiles tp
  join public.profiles p on p.id = tp.id
  where tp.id = p_tutor_id and tp.status = 'approved' and not p.is_suspended;

  if not found or p_duration is null or not (p_duration = any (v_durations)) then
    return;
  end if;

  v_from := greatest(p_from, now() + make_interval(hours => public.setting_int('min_booking_notice_hours', 12)));
  v_to   := least(p_to, now() + make_interval(days => public.setting_int('booking_horizon_days', 60)),
                  p_from + interval '62 days');
  if v_to <= v_from then
    return;
  end if;

  return query
  with days as (
    select d::date as day
    from generate_series(
      ((v_from at time zone v_tz)::date - 1)::timestamp,
      ((v_to at time zone v_tz)::date + 1)::timestamp,
      interval '1 day'
    ) d
  ),
  candidates as (
    select ((dy.day + make_interval(mins => m)) at time zone v_tz) as slot_start
    from days dy
    join public.tutor_availability a
      on a.tutor_id = p_tutor_id and a.weekday = extract(dow from dy.day)::smallint
    cross join lateral generate_series(
      -- align to the next 30 minute boundary inside the window
      a.start_minute + ((30 - a.start_minute % 30) % 30),
      a.end_minute - p_duration,
      30
    ) m
  )
  select distinct c.slot_start
  from candidates c
  where c.slot_start >= v_from
    and c.slot_start < v_to
    and not exists (
      select 1 from public.bookings b
      where b.tutor_id = p_tutor_id
        and b.status in ('pending', 'confirmed')
        and (p_ignore_booking is null or b.id <> p_ignore_booking)
        and tstzrange(b.starts_at, b.ends_at, '[)')
            && tstzrange(c.slot_start, c.slot_start + make_interval(mins => p_duration), '[)')
    )
    and not exists (
      select 1 from public.tutor_time_off t
      where t.tutor_id = p_tutor_id
        and tstzrange(t.starts_at, t.ends_at, '[)')
            && tstzrange(c.slot_start, c.slot_start + make_interval(mins => p_duration), '[)')
    )
  order by c.slot_start;
end;
$$;

-- Internal helper used by booking functions.
create or replace function public.is_bookable_slot(
  p_tutor_id uuid, p_starts_at timestamptz, p_duration integer, p_ignore_booking uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.get_tutor_slots(p_tutor_id, p_starts_at, p_starts_at + interval '1 minute', p_duration, p_ignore_booking) s
    where s.starts_at = p_starts_at
  );
$$;

create or replace function public.assert_active_user()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Please sign in first' using errcode = '42501';
  end if;
  if exists (select 1 from public.profiles where id = v_uid and is_suspended) then
    raise exception 'Your account is suspended' using errcode = '42501';
  end if;
  return v_uid;
end;
$$;

-- -----------------------------------------------------------------------------
-- Bookings
-- -----------------------------------------------------------------------------
create or replace function public.request_booking(
  p_tutor_id      uuid,
  p_language_code text,
  p_lesson_type   public.lesson_type,
  p_duration      integer,
  p_starts_at     timestamptz,
  p_note          text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := public.assert_active_user();
  v_tutor record;
  v_id    uuid;
  v_price integer;
begin
  if v_uid = p_tutor_id then
    raise exception 'You cannot book a lesson with yourself' using errcode = '22023';
  end if;

  select tp.hourly_rate_cents, tp.currency, tp.lesson_durations, tp.is_demo
    into v_tutor
  from public.tutor_profiles tp
  join public.profiles p on p.id = tp.id
  where tp.id = p_tutor_id and tp.status = 'approved' and p.role = 'tutor' and not p.is_suspended;

  if not found then
    raise exception 'This tutor is not accepting bookings' using errcode = 'P0002';
  end if;
  if v_tutor.is_demo then
    raise exception 'Demo profiles cannot be booked' using errcode = '22023';
  end if;
  if not (p_duration = any (v_tutor.lesson_durations)) then
    raise exception 'This tutor does not offer % minute lessons', p_duration using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.tutor_languages
    where tutor_id = p_tutor_id and language_code = p_language_code and teaches
  ) then
    raise exception 'This tutor does not teach the selected language' using errcode = '22023';
  end if;
  if p_lesson_type = 'trial' and exists (
    select 1 from public.bookings
    where student_id = v_uid and tutor_id = p_tutor_id and lesson_type = 'trial'
      and status in ('pending', 'confirmed', 'completed')
  ) then
    raise exception 'You already have a trial lesson with this tutor' using errcode = '22023';
  end if;
  if (select count(*) from public.bookings where student_id = v_uid and status = 'pending') >= 10 then
    raise exception 'You have too many pending requests. Wait for tutors to respond first.' using errcode = '22023';
  end if;
  if not public.is_bookable_slot(p_tutor_id, p_starts_at, p_duration) then
    raise exception 'This time is no longer available. Please pick another slot.' using errcode = 'P0001';
  end if;

  v_price := round(v_tutor.hourly_rate_cents * p_duration / 60.0);

  insert into public.bookings (
    student_id, tutor_id, language_code, lesson_type, duration_minutes,
    starts_at, ends_at, status, hourly_rate_cents, price_cents, currency, student_note
  ) values (
    v_uid, p_tutor_id, p_language_code, p_lesson_type, p_duration,
    p_starts_at, p_starts_at + make_interval(mins => p_duration), 'pending',
    v_tutor.hourly_rate_cents, v_price, v_tutor.currency, nullif(btrim(p_note), '')
  )
  returning id into v_id;

  perform public.notify_user(p_tutor_id, 'booking_requested', 'New lesson request',
    'A student requested a ' || p_duration || ' minute lesson.', '/bookings/' || v_id);
  return v_id;
exception
  when exclusion_violation then
    raise exception 'This time overlaps another lesson. Please pick another slot.' using errcode = '23P01';
end;
$$;

create or replace function public.respond_booking(
  p_booking_id uuid, p_accept boolean, p_reason text default null
)
returns public.booking_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.assert_active_user();
  v_b   public.bookings;
begin
  select * into v_b from public.bookings where id = p_booking_id for update;
  if not found or v_b.tutor_id <> v_uid then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;
  if v_b.status <> 'pending' then
    raise exception 'This request was already handled' using errcode = '22023';
  end if;

  if p_accept then
    if v_b.starts_at <= now() then
      raise exception 'This lesson time has already passed' using errcode = '22023';
    end if;
    if not exists (select 1 from public.tutor_profiles where id = v_uid and status = 'approved') then
      raise exception 'Your tutor profile must be approved to accept lessons' using errcode = '42501';
    end if;
    update public.bookings
       set status = 'confirmed', confirmed_at = now(), responded_at = now()
     where id = p_booking_id;
    perform public.notify_user(v_b.student_id, 'booking_confirmed', 'Your lesson is confirmed',
      null, '/bookings/' || p_booking_id);
    return 'confirmed';
  end if;

  update public.bookings
     set status = 'rejected', responded_at = now(),
         cancellation_reason = left(nullif(btrim(p_reason), ''), 500)
   where id = p_booking_id;
  perform public.notify_user(v_b.student_id, 'booking_rejected', 'Your lesson request was declined',
    left(nullif(btrim(p_reason), ''), 500), '/bookings/' || p_booking_id);
  return 'rejected';
end;
$$;

create or replace function public.cancel_booking(p_booking_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := public.assert_active_user();
  v_b      public.bookings;
  v_window integer := public.setting_int('student_cancel_window_hours', 24);
  v_other  uuid;
begin
  select * into v_b from public.bookings where id = p_booking_id for update;
  if not found or (v_b.student_id <> v_uid and v_b.tutor_id <> v_uid) then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;
  if v_b.status not in ('pending', 'confirmed') then
    raise exception 'Only pending or confirmed lessons can be cancelled' using errcode = '22023';
  end if;
  if v_b.starts_at <= now() then
    raise exception 'Lessons that have started can no longer be cancelled' using errcode = '22023';
  end if;
  if v_b.student_id = v_uid and v_b.status = 'confirmed'
     and v_b.starts_at < now() + make_interval(hours => v_window) then
    raise exception 'Confirmed lessons can only be cancelled at least % hours in advance. Message your tutor to reschedule instead.', v_window
      using errcode = '22023';
  end if;

  update public.bookings
     set status = 'cancelled', cancelled_at = now(), cancelled_by = v_uid,
         cancellation_reason = left(nullif(btrim(p_reason), ''), 500),
         reschedule_starts_at = null, reschedule_requested_by = null
   where id = p_booking_id;

  v_other := case when v_uid = v_b.student_id then v_b.tutor_id else v_b.student_id end;
  perform public.notify_user(v_other, 'booking_cancelled', 'A lesson was cancelled',
    left(nullif(btrim(p_reason), ''), 500), '/bookings/' || p_booking_id);
end;
$$;

create or replace function public.request_reschedule(p_booking_id uuid, p_new_starts_at timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.assert_active_user();
  v_b   public.bookings;
begin
  select * into v_b from public.bookings where id = p_booking_id for update;
  if not found or (v_b.student_id <> v_uid and v_b.tutor_id <> v_uid) then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;
  if v_b.status not in ('pending', 'confirmed') or v_b.starts_at <= now() then
    raise exception 'This lesson can no longer be rescheduled' using errcode = '22023';
  end if;
  if p_new_starts_at = v_b.starts_at then
    raise exception 'Pick a different time' using errcode = '22023';
  end if;
  if not public.is_bookable_slot(v_b.tutor_id, p_new_starts_at, v_b.duration_minutes, p_booking_id) then
    raise exception 'The new time is not available' using errcode = 'P0001';
  end if;

  update public.bookings
     set reschedule_starts_at = p_new_starts_at, reschedule_requested_by = v_uid
   where id = p_booking_id;

  perform public.notify_user(
    case when v_uid = v_b.student_id then v_b.tutor_id else v_b.student_id end,
    'reschedule_requested', 'New time proposed for a lesson', null, '/bookings/' || p_booking_id);
end;
$$;

create or replace function public.respond_reschedule(p_booking_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.assert_active_user();
  v_b   public.bookings;
begin
  select * into v_b from public.bookings where id = p_booking_id for update;
  if not found or (v_b.student_id <> v_uid and v_b.tutor_id <> v_uid) then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;
  if v_b.reschedule_starts_at is null then
    raise exception 'There is no pending reschedule request' using errcode = '22023';
  end if;
  if p_accept and v_b.reschedule_requested_by = v_uid then
    raise exception 'The other participant has to accept your proposal' using errcode = '42501';
  end if;

  if p_accept then
    if v_b.status not in ('pending', 'confirmed')
       or not public.is_bookable_slot(v_b.tutor_id, v_b.reschedule_starts_at, v_b.duration_minutes, p_booking_id) then
      raise exception 'The proposed time is no longer available' using errcode = 'P0001';
    end if;
    update public.bookings
       set starts_at = reschedule_starts_at,
           ends_at = reschedule_starts_at + make_interval(mins => duration_minutes),
           reschedule_starts_at = null, reschedule_requested_by = null
     where id = p_booking_id;
  else
    update public.bookings
       set reschedule_starts_at = null, reschedule_requested_by = null
     where id = p_booking_id;
  end if;

  -- Withdrawing your own proposal does not notify anyone.
  if v_b.reschedule_requested_by <> v_uid then
    perform public.notify_user(v_b.reschedule_requested_by,
      case when p_accept then 'reschedule_accepted' else 'reschedule_declined' end,
      case when p_accept then 'New lesson time accepted' else 'New lesson time declined' end,
      null, '/bookings/' || p_booking_id);
  end if;
exception
  when exclusion_violation then
    raise exception 'The proposed time overlaps another lesson' using errcode = '23P01';
end;
$$;

create or replace function public.complete_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.assert_active_user();
  v_b   public.bookings;
begin
  select * into v_b from public.bookings where id = p_booking_id for update;
  if not found or (v_b.tutor_id <> v_uid and not public.is_admin()) then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;
  if v_b.status <> 'confirmed' then
    raise exception 'Only confirmed lessons can be marked as completed' using errcode = '22023';
  end if;
  if v_b.ends_at > now() then
    raise exception 'A lesson can be marked as completed after it ends' using errcode = '22023';
  end if;

  update public.bookings set status = 'completed', completed_at = now() where id = p_booking_id;
  update public.tutor_profiles set completed_lessons = completed_lessons + 1 where id = v_b.tutor_id;
  perform public.notify_user(v_b.student_id, 'lesson_completed', 'How was your lesson?',
    'Leave a review to help other students.', '/bookings/' || p_booking_id);
end;
$$;

-- -----------------------------------------------------------------------------
-- Reviews: keep tutor aggregates in sync (published reviews only)
-- -----------------------------------------------------------------------------
create or replace function public.refresh_tutor_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tutor uuid := coalesce(new.tutor_id, old.tutor_id);
begin
  update public.tutor_profiles tp
     set avg_rating = coalesce((select round(avg(r.rating)::numeric, 2) from public.reviews r
                                where r.tutor_id = v_tutor and r.status = 'published'), 0),
         review_count = (select count(*) from public.reviews r
                         where r.tutor_id = v_tutor and r.status = 'published')
   where tp.id = v_tutor;

  if tg_op = 'INSERT' then
    perform public.notify_user(new.tutor_id, 'review_received', 'You received a new review',
      new.rating || ' / 5', '/dashboard/tutor');
  end if;
  return null;
end;
$$;

create trigger reviews_refresh_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_tutor_rating();

-- -----------------------------------------------------------------------------
-- Messaging
-- -----------------------------------------------------------------------------
create or replace function public.start_conversation(p_other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := public.assert_active_user();
  v_low  uuid;
  v_high uuid;
  v_id   uuid;
begin
  if p_other_user is null or p_other_user = v_uid then
    raise exception 'Choose someone else to message' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = p_other_user and not is_suspended) then
    raise exception 'User not found' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.tutor_profiles where id = p_other_user and is_demo) then
    raise exception 'Demo profiles cannot receive messages' using errcode = '22023';
  end if;

  v_low  := least(v_uid, p_other_user);
  v_high := greatest(v_uid, p_other_user);

  select id into v_id from public.conversations where user_low = v_low and user_high = v_high;
  if v_id is not null then
    return v_id;
  end if;

  -- New conversations: contact an approved tutor, someone you have a booking
  -- with, or (for admins) anyone.
  if not (
    exists (
      select 1 from public.tutor_profiles tp join public.profiles p on p.id = tp.id
      where tp.id = p_other_user and tp.status = 'approved' and p.role = 'tutor'
    )
    or exists (
      select 1 from public.bookings b
      where (b.student_id = v_uid and b.tutor_id = p_other_user)
         or (b.tutor_id = v_uid and b.student_id = p_other_user)
    )
    or public.is_admin()
  ) then
    raise exception 'You can only start conversations with tutors or your students' using errcode = '42501';
  end if;

  insert into public.conversations (user_low, user_high)
  values (v_low, v_high)
  on conflict (user_low, user_high) do update set user_low = excluded.user_low
  returning id into v_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values (v_id, v_low), (v_id, v_high)
  on conflict do nothing;

  return v_id;
end;
$$;

create or replace function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recipient uuid;
  v_link      text := '/messages/' || new.conversation_id;
  v_name      text;
begin
  update public.conversations
     set last_message_at = new.created_at,
         last_message_preview = left(new.body, 140),
         last_message_sender = new.sender_id
   where id = new.conversation_id;

  update public.conversation_participants
     set last_read_at = new.created_at
   where conversation_id = new.conversation_id and user_id = new.sender_id;

  select user_id into v_recipient
  from public.conversation_participants
  where conversation_id = new.conversation_id and user_id <> new.sender_id
  limit 1;

  -- One unread notification per conversation is enough.
  if v_recipient is not null and not exists (
    select 1 from public.notifications
    where user_id = v_recipient and type = 'message' and link = v_link and read_at is null
  ) then
    select coalesce(nullif(btrim(full_name), ''), 'Someone') into v_name
    from public.profiles where id = new.sender_id;
    perform public.notify_user(v_recipient, 'message', 'New message from ' || v_name,
      left(new.body, 140), v_link);
  end if;
  return null;
end;
$$;

create trigger messages_after_insert
  after insert on public.messages
  for each row execute function public.handle_new_message();

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Please sign in first' using errcode = '42501';
  end if;
  update public.conversation_participants
     set last_read_at = now()
   where conversation_id = p_conversation_id and user_id = v_uid;

  update public.notifications
     set read_at = now()
   where user_id = v_uid and type = 'message'
     and link = '/messages/' || p_conversation_id and read_at is null;
end;
$$;

create or replace function public.get_my_conversations(p_limit integer default 50)
returns table (
  conversation_id      uuid,
  other_user_id        uuid,
  other_name           text,
  other_avatar_url     text,
  other_role           public.user_role,
  last_message_at      timestamptz,
  last_message_preview text,
  last_message_sender  uuid,
  unread_count         bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id, other.user_id, p.full_name, p.avatar_url, p.role,
    c.last_message_at, c.last_message_preview, c.last_message_sender,
    (select count(*) from public.messages m
      where m.conversation_id = c.id and m.sender_id <> me.user_id and m.created_at > me.last_read_at)
  from public.conversation_participants me
  join public.conversations c on c.id = me.conversation_id
  join public.conversation_participants other
    on other.conversation_id = c.id and other.user_id <> me.user_id
  join public.profiles p on p.id = other.user_id
  where me.user_id = (select auth.uid())
  order by coalesce(c.last_message_at, c.created_at) desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

-- -----------------------------------------------------------------------------
-- Admin statistics
-- -----------------------------------------------------------------------------
create or replace function public.admin_platform_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrators only' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'students',          (select count(*) from public.profiles where role = 'student'),
    'tutors_approved',   (select count(*) from public.tutor_profiles where status = 'approved'),
    'tutors_pending',    (select count(*) from public.tutor_profiles where status = 'pending'),
    'bookings_total',    (select count(*) from public.bookings),
    'bookings_pending',  (select count(*) from public.bookings where status = 'pending'),
    'bookings_upcoming', (select count(*) from public.bookings where status = 'confirmed' and starts_at > now()),
    'lessons_completed', (select count(*) from public.bookings where status = 'completed'),
    'reports_open',      (select count(*) from public.reports where status in ('open', 'reviewing')),
    'messages_7d',       (select count(*) from public.messages where created_at > now() - interval '7 days')
  );
end;
$$;
