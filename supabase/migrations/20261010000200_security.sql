-- =============================================================================
-- Lingora: authorization helpers, guard triggers and Row Level Security
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so they can be used inside policies
-- without recursive RLS evaluation). All use an empty search_path.
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and not is_suspended
  );
$$;

-- True when the current database role is an end-user role coming through the
-- Supabase API (anon / authenticated). Trusted SECURITY DEFINER functions run
-- as their owner and therefore bypass the guard triggers below.
create or replace function public.is_end_user_context()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user in ('anon', 'authenticated');
$$;

create or replace function public.is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = p_conversation_id and user_id = (select auth.uid())
  );
$$;

-- Who may see a profile row: the owner, admins, anyone for approved tutors,
-- and users who share a conversation or booking with the profile owner.
create or replace function public.can_view_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_profile_id = (select auth.uid())
    or public.is_admin()
    or exists (
      select 1 from public.tutor_profiles tp
      join public.profiles p on p.id = tp.id
      where tp.id = p_profile_id and tp.status = 'approved' and p.role = 'tutor' and not p.is_suspended
    )
    or exists (
      select 1 from public.conversation_participants me
      join public.conversation_participants other
        on other.conversation_id = me.conversation_id
      where me.user_id = (select auth.uid()) and other.user_id = p_profile_id
    )
    or exists (
      select 1 from public.bookings b
      where (b.student_id = (select auth.uid()) and b.tutor_id = p_profile_id)
         or (b.tutor_id = (select auth.uid()) and b.student_id = p_profile_id)
    );
$$;

create or replace function public.setting_int(p_key text, p_default integer)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select (value #>> '{}')::integer from public.platform_settings where key = p_key),
    p_default
  );
$$;

-- Internal: create a notification. Not callable by API roles.
create or replace function public.notify_user(
  p_user_id uuid, p_type text, p_title text, p_body text, p_link text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user_id, p_type, p_title, p_body, p_link);
$$;
revoke execute on function public.notify_user(uuid, text, text, text, text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- New auth user -> profile. Role comes from sign-up metadata but can never be
-- "admin". Admins are promoted manually (see README).
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role := 'student';
  v_tz   text := coalesce(new.raw_user_meta_data ->> 'timezone', 'UTC');
begin
  if new.raw_user_meta_data ->> 'role' = 'tutor' then
    v_role := 'tutor';
  end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = v_tz) then
    v_tz := 'UTC';
  end if;

  insert into public.profiles (id, role, full_name, timezone)
  values (
    new.id,
    v_role,
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), ''), 100),
    v_tz
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Tutors always have a tutor_profiles row (draft until submitted).
create or replace function public.ensure_tutor_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'tutor' then
    insert into public.tutor_profiles (id) values (new.id) on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

create trigger profiles_ensure_tutor_profile
  after insert or update of role on public.profiles
  for each row execute function public.ensure_tutor_profile();

-- -----------------------------------------------------------------------------
-- Guard: profiles. Users can edit their own profile but cannot grant
-- themselves admin, lift a suspension or change protected columns.
-- -----------------------------------------------------------------------------
create or replace function public.guard_profiles()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_end_user_context() and not public.is_admin() then
    if new.role is distinct from old.role and (new.role = 'admin' or old.role = 'admin') then
      raise exception 'You are not allowed to change this role' using errcode = '42501';
    end if;
    new.is_suspended := old.is_suspended;
    new.created_at := old.created_at;
  end if;

  if new.timezone is distinct from old.timezone
     and not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Invalid time zone: %', new.timezone using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profiles();

-- -----------------------------------------------------------------------------
-- Guard: tutor_profiles. Tutors can edit content and submit for review;
-- only admins (or trusted functions) change approval status and statistics.
-- -----------------------------------------------------------------------------
create or replace function public.guard_tutor_profiles()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_privileged boolean := not public.is_end_user_context() or public.is_admin();
begin
  if tg_op = 'INSERT' then
    if not v_privileged then
      new.status := 'draft';
      new.avg_rating := 0;
      new.review_count := 0;
      new.completed_lessons := 0;
      new.is_demo := false;
      new.reviewed_at := null;
      new.reviewed_by := null;
      new.rejection_reason := null;
      new.submitted_at := null;
    end if;
    return new;
  end if;

  if not v_privileged then
    new.avg_rating := old.avg_rating;
    new.review_count := old.review_count;
    new.completed_lessons := old.completed_lessons;
    new.is_demo := old.is_demo;
    new.reviewed_at := old.reviewed_at;
    new.reviewed_by := old.reviewed_by;
    new.rejection_reason := old.rejection_reason;
    new.submitted_at := old.submitted_at;

    if new.status is distinct from old.status
       and not (old.status in ('draft', 'rejected') and new.status = 'pending')
       and not (old.status = 'pending' and new.status = 'draft') then
      raise exception 'Only administrators can change the approval status' using errcode = '42501';
    end if;
  end if;

  if new.status is distinct from old.status then
    if new.status = 'pending' then
      if char_length(btrim(new.headline)) < 5 or char_length(btrim(new.about)) < 50 then
        raise exception 'Add a headline and an "about me" text of at least 50 characters before submitting'
          using errcode = '23514';
      end if;
      if not exists (select 1 from public.tutor_languages where tutor_id = new.id and teaches) then
        raise exception 'Add at least one language you teach before submitting' using errcode = '23514';
      end if;
      new.submitted_at := now();
      new.rejection_reason := null;
    elsif new.status in ('approved', 'rejected', 'suspended') then
      new.reviewed_at := now();
      new.reviewed_by := (select auth.uid());
    end if;
  end if;
  return new;
end;
$$;

create trigger tutor_profiles_guard before insert or update on public.tutor_profiles
  for each row execute function public.guard_tutor_profiles();

-- Notify tutors when an admin decides on their application.
create or replace function public.notify_tutor_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'approved' then
      perform public.notify_user(new.id, 'tutor_approved', 'Your tutor profile is approved',
        'Your profile is now visible to students.', '/dashboard/tutor');
    elsif new.status = 'rejected' then
      perform public.notify_user(new.id, 'tutor_rejected', 'Your tutor application needs changes',
        coalesce(new.rejection_reason, 'Please review your profile and resubmit.'), '/dashboard/tutor/profile');
    elsif new.status = 'suspended' then
      perform public.notify_user(new.id, 'tutor_suspended', 'Your tutor profile was suspended',
        coalesce(new.rejection_reason, 'Contact support for details.'), '/dashboard/tutor');
    elsif new.status = 'pending' then
      insert into public.notifications (user_id, type, title, body, link)
      select p.id, 'tutor_application', 'New tutor application', null, '/admin/tutors'
      from public.profiles p where p.role = 'admin' and not p.is_suspended;
    end if;
  end if;
  return new;
end;
$$;

create trigger tutor_profiles_status_notify after update of status on public.tutor_profiles
  for each row execute function public.notify_tutor_status();

-- -----------------------------------------------------------------------------
-- Guard: reviews. Students write reviews; moderation status is admin-only.
-- -----------------------------------------------------------------------------
create or replace function public.guard_reviews()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_end_user_context() and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.status := 'published';
    else
      new.status := old.status;
      new.booking_id := old.booking_id;
      new.tutor_id := old.tutor_id;
      new.student_id := old.student_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger reviews_guard before insert or update on public.reviews
  for each row execute function public.guard_reviews();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.languages                 enable row level security;
alter table public.profiles                  enable row level security;
alter table public.tutor_profiles            enable row level security;
alter table public.tutor_languages           enable row level security;
alter table public.student_languages         enable row level security;
alter table public.tutor_availability        enable row level security;
alter table public.tutor_time_off            enable row level security;
alter table public.bookings                  enable row level security;
alter table public.conversations             enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages                  enable row level security;
alter table public.favorites                 enable row level security;
alter table public.reviews                   enable row level security;
alter table public.notifications             enable row level security;
alter table public.reports                   enable row level security;
alter table public.platform_settings         enable row level security;

-- languages ------------------------------------------------------------------
create policy languages_read on public.languages
  for select to anon, authenticated using (true);
create policy languages_admin_write on public.languages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- platform_settings -----------------------------------------------------------
create policy settings_read on public.platform_settings
  for select to anon, authenticated using (true);
create policy settings_admin_write on public.platform_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- profiles -------------------------------------------------------------------
create policy profiles_read on public.profiles
  for select to anon, authenticated using (public.can_view_profile(id));
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());
-- No insert policy: rows are created by the auth trigger. No delete policy:
-- accounts are removed through Supabase Auth (cascade).

-- tutor_profiles ---------------------------------------------------------------
create policy tutor_profiles_read on public.tutor_profiles
  for select to anon, authenticated
  using (
    id = (select auth.uid())
    or public.is_admin()
    or (status = 'approved' and exists (
      select 1 from public.profiles p where p.id = tutor_profiles.id and p.role = 'tutor' and not p.is_suspended
    ))
  );
create policy tutor_profiles_insert_own on public.tutor_profiles
  for insert to authenticated
  with check (
    id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'tutor')
  );
create policy tutor_profiles_update on public.tutor_profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- tutor_languages ------------------------------------------------------------
create policy tutor_languages_read on public.tutor_languages
  for select to anon, authenticated
  using (exists (select 1 from public.tutor_profiles tp where tp.id = tutor_languages.tutor_id));
create policy tutor_languages_write_own on public.tutor_languages
  for all to authenticated
  using (tutor_id = (select auth.uid()))
  with check (tutor_id = (select auth.uid()));

-- tutor_availability ---------------------------------------------------------
create policy tutor_availability_read on public.tutor_availability
  for select to anon, authenticated
  using (exists (select 1 from public.tutor_profiles tp where tp.id = tutor_availability.tutor_id));
create policy tutor_availability_write_own on public.tutor_availability
  for all to authenticated
  using (tutor_id = (select auth.uid()))
  with check (tutor_id = (select auth.uid()));

-- tutor_time_off (private; public slot calculation goes through get_tutor_slots)
create policy tutor_time_off_own on public.tutor_time_off
  for all to authenticated
  using (tutor_id = (select auth.uid()) or public.is_admin())
  with check (tutor_id = (select auth.uid()));

-- student_languages ----------------------------------------------------------
create policy student_languages_own on public.student_languages
  for all to authenticated
  using (student_id = (select auth.uid()) or public.is_admin())
  with check (student_id = (select auth.uid()));

-- bookings: read by participants and admins; writes only via RPC functions ---
create policy bookings_read on public.bookings
  for select to authenticated
  using (student_id = (select auth.uid()) or tutor_id = (select auth.uid()) or public.is_admin());
revoke insert, update, delete on public.bookings from anon, authenticated;

-- conversations / participants / messages -----------------------------------
create policy conversations_read on public.conversations
  for select to authenticated using (public.is_conversation_participant(id));
revoke insert, update, delete on public.conversations from anon, authenticated;

create policy conversation_participants_read on public.conversation_participants
  for select to authenticated using (public.is_conversation_participant(conversation_id));
revoke insert, update, delete on public.conversation_participants from anon, authenticated;

create policy messages_read on public.messages
  for select to authenticated using (public.is_conversation_participant(conversation_id));
create policy messages_insert on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.is_conversation_participant(conversation_id)
    and not exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_suspended)
  );
revoke update, delete on public.messages from anon, authenticated;

-- favorites ------------------------------------------------------------------
create policy favorites_read_own on public.favorites
  for select to authenticated using (student_id = (select auth.uid()));
create policy favorites_insert_own on public.favorites
  for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and tutor_id <> (select auth.uid())
    and exists (select 1 from public.tutor_profiles tp where tp.id = favorites.tutor_id and tp.status = 'approved')
  );
create policy favorites_delete_own on public.favorites
  for delete to authenticated using (student_id = (select auth.uid()));

-- reviews --------------------------------------------------------------------
create policy reviews_read on public.reviews
  for select to anon, authenticated
  using (
    status = 'published'
    or student_id = (select auth.uid())
    or tutor_id = (select auth.uid())
    or public.is_admin()
  );
create policy reviews_insert_eligible on public.reviews
  for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and tutor_id <> (select auth.uid())
    and exists (
      select 1 from public.bookings b
      where b.id = reviews.booking_id
        and b.student_id = (select auth.uid())
        and b.tutor_id = reviews.tutor_id
        and b.status = 'completed'
    )
  );
create policy reviews_update on public.reviews
  for update to authenticated
  using (student_id = (select auth.uid()) or public.is_admin())
  with check (student_id = (select auth.uid()) or public.is_admin());
create policy reviews_delete on public.reviews
  for delete to authenticated using (student_id = (select auth.uid()) or public.is_admin());

-- notifications: users read their own and may only set read_at -------------
create policy notifications_read_own on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy notifications_delete_own on public.notifications
  for delete to authenticated using (user_id = (select auth.uid()));
revoke insert, update on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

-- reports --------------------------------------------------------------------
create policy reports_insert_own on public.reports
  for insert to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'open' and admin_note is null and resolved_by is null);
create policy reports_read on public.reports
  for select to authenticated using (reporter_id = (select auth.uid()) or public.is_admin());
create policy reports_admin_update on public.reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Anonymous visitors never write anything.
revoke insert, update, delete on all tables in schema public from anon;
