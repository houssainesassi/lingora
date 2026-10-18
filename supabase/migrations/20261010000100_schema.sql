-- =============================================================================
-- Lingora: core schema
-- Tables, enums, constraints and indexes. Security (RLS) lives in the next
-- migration, business functions in the one after that.
-- =============================================================================

create extension if not exists btree_gist with schema extensions;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('student', 'tutor', 'admin');
create type public.tutor_status as enum ('draft', 'pending', 'approved', 'rejected', 'suspended');
create type public.cefr_level as enum ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed', 'rejected');
create type public.lesson_type as enum ('trial', 'conversation', 'structured', 'exam_prep', 'business');
create type public.review_status as enum ('published', 'hidden');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

-- -----------------------------------------------------------------------------
-- Generic helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Reference data: languages (admin-managed, add more rows to support more)
-- -----------------------------------------------------------------------------
create table public.languages (
  code        text primary key check (code ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$'),
  name        text not null check (char_length(name) between 1 and 60),
  native_name text check (native_name is null or char_length(native_name) <= 60),
  is_active   boolean not null default true,
  sort_order  integer not null default 100,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  role           public.user_role not null default 'student',
  full_name      text not null default '' check (char_length(full_name) <= 100),
  avatar_url     text check (avatar_url is null or char_length(avatar_url) <= 500),
  country        text check (country is null or country ~ '^[A-Z]{2}$'),
  timezone       text not null default 'UTC' check (char_length(timezone) <= 64),
  bio            text check (bio is null or char_length(bio) <= 2000),
  learning_goals text check (learning_goals is null or char_length(learning_goals) <= 2000),
  onboarded      boolean not null default false,
  is_suspended   boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Tutor profiles
-- -----------------------------------------------------------------------------
create table public.tutor_profiles (
  id                        uuid primary key references public.profiles (id) on delete cascade,
  headline                  text not null default '' check (char_length(headline) <= 120),
  about                     text not null default '' check (char_length(about) <= 4000),
  teaching_experience_years integer not null default 0 check (teaching_experience_years between 0 and 60),
  certifications            text check (certifications is null or char_length(certifications) <= 2000),
  specialties               text[] not null default '{}' check (cardinality(specialties) <= 12),
  levels_taught             public.cefr_level[] not null default '{}',
  hourly_rate_cents         integer not null default 2000 check (hourly_rate_cents between 500 and 50000),
  currency                  text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  lesson_durations          integer[] not null default '{25,50}'
                              check (cardinality(lesson_durations) between 1 and 3
                                     and lesson_durations <@ array[25, 50, 60]),
  status                    public.tutor_status not null default 'draft',
  rejection_reason          text check (rejection_reason is null or char_length(rejection_reason) <= 1000),
  submitted_at              timestamptz,
  reviewed_at               timestamptz,
  reviewed_by               uuid references public.profiles (id) on delete set null,
  avg_rating                numeric(3, 2) not null default 0,
  review_count              integer not null default 0,
  completed_lessons         integer not null default 0,
  is_demo                   boolean not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
create index tutor_profiles_status_idx on public.tutor_profiles (status);
create index tutor_profiles_specialties_idx on public.tutor_profiles using gin (specialties);
create index tutor_profiles_rate_idx on public.tutor_profiles (hourly_rate_cents);
create trigger tutor_profiles_updated_at before update on public.tutor_profiles
  for each row execute function public.set_updated_at();

create table public.tutor_languages (
  tutor_id      uuid not null references public.tutor_profiles (id) on delete cascade,
  language_code text not null references public.languages (code) on update cascade,
  teaches       boolean not null default true,
  is_native     boolean not null default false,
  proficiency   public.cefr_level,
  primary key (tutor_id, language_code),
  constraint tutor_languages_level_required check (is_native or proficiency is not null)
);
create index tutor_languages_lang_idx on public.tutor_languages (language_code) where teaches;
create index tutor_languages_native_idx on public.tutor_languages (language_code) where is_native;

-- -----------------------------------------------------------------------------
-- Student learning languages
-- -----------------------------------------------------------------------------
create table public.student_languages (
  student_id    uuid not null references public.profiles (id) on delete cascade,
  language_code text not null references public.languages (code) on update cascade,
  current_level public.cefr_level not null default 'A1',
  target_level  public.cefr_level,
  goal          text check (goal is null or char_length(goal) <= 500),
  created_at    timestamptz not null default now(),
  primary key (student_id, language_code)
);

-- -----------------------------------------------------------------------------
-- Availability (weekly recurring windows in the tutor's own timezone)
-- -----------------------------------------------------------------------------
create table public.tutor_availability (
  id           uuid primary key default gen_random_uuid(),
  tutor_id     uuid not null references public.tutor_profiles (id) on delete cascade,
  weekday      smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_minute integer not null check (start_minute between 0 and 1439),
  end_minute   integer not null check (end_minute between 1 and 1440),
  created_at   timestamptz not null default now(),
  constraint tutor_availability_range check (end_minute - start_minute >= 25),
  constraint tutor_availability_no_overlap exclude using gist (
    tutor_id with =,
    weekday with =,
    int4range(start_minute, end_minute) with &&
  )
);

-- One-off blocked periods (holidays, appointments...)
create table public.tutor_time_off (
  id         uuid primary key default gen_random_uuid(),
  tutor_id   uuid not null references public.tutor_profiles (id) on delete cascade,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  note       text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now(),
  constraint tutor_time_off_range check (ends_at > starts_at)
);
create index tutor_time_off_tutor_idx on public.tutor_time_off (tutor_id, starts_at);

-- -----------------------------------------------------------------------------
-- Bookings
-- Overlaps are prevented by exclusion constraints, so integrity holds even
-- under concurrent requests.
-- -----------------------------------------------------------------------------
create table public.bookings (
  id                      uuid primary key default gen_random_uuid(),
  student_id              uuid not null references public.profiles (id) on delete cascade,
  tutor_id                uuid not null references public.tutor_profiles (id) on delete cascade,
  language_code           text not null references public.languages (code) on update cascade,
  lesson_type             public.lesson_type not null default 'conversation',
  duration_minutes        integer not null check (duration_minutes in (25, 50, 60)),
  starts_at               timestamptz not null,
  ends_at                 timestamptz not null,
  status                  public.booking_status not null default 'pending',
  -- Price snapshot at booking time. Payments are NOT implemented yet.
  hourly_rate_cents       integer not null check (hourly_rate_cents >= 0),
  price_cents             integer not null check (price_cents >= 0),
  currency                text not null check (currency ~ '^[A-Z]{3}$'),
  student_note            text check (student_note is null or char_length(student_note) <= 1000),
  cancellation_reason     text check (cancellation_reason is null or char_length(cancellation_reason) <= 500),
  cancelled_by            uuid references public.profiles (id) on delete set null,
  responded_at            timestamptz,
  confirmed_at            timestamptz,
  cancelled_at            timestamptz,
  completed_at            timestamptz,
  reschedule_starts_at    timestamptz,
  reschedule_requested_by uuid references public.profiles (id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint bookings_not_self check (student_id <> tutor_id),
  constraint bookings_duration_matches check (ends_at = starts_at + make_interval(mins => duration_minutes)),
  constraint bookings_no_tutor_overlap exclude using gist (
    tutor_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'confirmed')),
  constraint bookings_no_student_overlap exclude using gist (
    student_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'confirmed'))
);
create index bookings_student_idx on public.bookings (student_id, starts_at desc);
create index bookings_tutor_idx on public.bookings (tutor_id, starts_at desc);
create index bookings_status_idx on public.bookings (status);
create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Messaging (strictly one-to-one)
-- -----------------------------------------------------------------------------
create table public.conversations (
  id                   uuid primary key default gen_random_uuid(),
  user_low             uuid not null references public.profiles (id) on delete cascade,
  user_high            uuid not null references public.profiles (id) on delete cascade,
  last_message_at      timestamptz,
  last_message_preview text,
  last_message_sender  uuid references public.profiles (id) on delete set null,
  created_at           timestamptz not null default now(),
  constraint conversations_ordered_pair check (user_low < user_high),
  constraint conversations_unique_pair unique (user_low, user_high)
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index conversation_participants_user_idx on public.conversation_participants (user_id);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  body            text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at      timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Favorites
-- -----------------------------------------------------------------------------
create table public.favorites (
  student_id uuid not null references public.profiles (id) on delete cascade,
  tutor_id   uuid not null references public.tutor_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, tutor_id),
  constraint favorites_not_self check (student_id <> tutor_id)
);
create index favorites_tutor_idx on public.favorites (tutor_id);

-- -----------------------------------------------------------------------------
-- Reviews (one per completed booking)
-- -----------------------------------------------------------------------------
create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  tutor_id   uuid not null references public.tutor_profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  comment    text check (comment is null or char_length(comment) <= 2000),
  status     public.review_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_not_self check (student_id <> tutor_id)
);
create index reviews_tutor_idx on public.reviews (tutor_id, created_at desc);
create trigger reviews_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Notifications (written only by trusted database functions)
-- -----------------------------------------------------------------------------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null check (char_length(type) <= 40),
  title      text not null check (char_length(title) <= 200),
  body       text check (body is null or char_length(body) <= 1000),
  link       text check (link is null or (link like '/%' and char_length(link) <= 300)),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

-- -----------------------------------------------------------------------------
-- Reports (user / review moderation)
-- -----------------------------------------------------------------------------
create table public.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references public.profiles (id) on delete cascade,
  reported_user_id uuid references public.profiles (id) on delete cascade,
  review_id        uuid references public.reviews (id) on delete cascade,
  reason           text not null check (reason in ('spam', 'harassment', 'inappropriate', 'fraud', 'no_show', 'other')),
  details          text check (details is null or char_length(details) <= 2000),
  status           public.report_status not null default 'open',
  admin_note       text check (admin_note is null or char_length(admin_note) <= 2000),
  resolved_by      uuid references public.profiles (id) on delete set null,
  resolved_at      timestamptz,
  created_at       timestamptz not null default now(),
  constraint reports_has_target check (reported_user_id is not null or review_id is not null),
  constraint reports_not_self check (reported_user_id is null or reported_user_id <> reporter_id)
);
create index reports_status_idx on public.reports (status, created_at desc);

-- -----------------------------------------------------------------------------
-- Admin-managed platform settings (non-secret values only)
-- -----------------------------------------------------------------------------
create table public.platform_settings (
  key         text primary key check (key ~ '^[a-z0-9_]{2,64}$'),
  value       jsonb not null,
  description text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id) on delete set null
);
create trigger platform_settings_updated_at before update on public.platform_settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Reference rows
-- -----------------------------------------------------------------------------
insert into public.languages (code, name, native_name, sort_order) values
  ('en', 'English',    'English',   10),
  ('de', 'German',     'Deutsch',   20),
  ('fr', 'French',     'Français',  30),
  ('it', 'Italian',    'Italiano',  40),
  ('es', 'Spanish',    'Español',   50),
  ('ar', 'Arabic',     'العربية',   60),
  ('pt', 'Portuguese', 'Português', 70);

insert into public.platform_settings (key, value, description) values
  ('min_booking_notice_hours', '12', 'Minimum hours between booking time and lesson start.'),
  ('student_cancel_window_hours', '24', 'Students may cancel confirmed lessons up to this many hours before start.'),
  ('booking_horizon_days', '60', 'How far ahead students can book.'),
  ('join_early_minutes', '10', 'Minutes before start that participants may join a call.'),
  ('platform_commission_percent', '0', 'Reserved for the future payment integration. Not applied yet.');

-- -----------------------------------------------------------------------------
-- Explicit API role grants. Newer Supabase projects may not expose new tables
-- to the Data API automatically. Row Level Security (next migration) decides
-- which rows each role can actually touch, and some privileges are revoked
-- again there (e.g. direct booking writes).
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
