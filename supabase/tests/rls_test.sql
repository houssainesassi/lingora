-- =============================================================================
-- Authorization tests for anonymous users, students, tutors and admins.
-- Run with:  npm run db:test   (spins up a disposable Postgres container)
-- Any failed expectation raises an exception and aborts the run.
-- =============================================================================
\set ON_ERROR_STOP on
\set QUIET on
\o /dev/null

-- Fixed ids
\set student1 '''11111111-1111-1111-1111-111111111111'''
\set student2 '''22222222-2222-2222-2222-222222222222'''
\set tutor    '''33333333-3333-3333-3333-333333333333'''
\set admin    '''44444444-4444-4444-4444-444444444444'''
\set tutor2   '''55555555-5555-5555-5555-555555555555'''

create or replace function public._expect_error(p_sql text, p_label text)
returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    raise notice 'ok   % (rejected: %)', p_label, sqlerrm;
    return;
  end;
  raise exception 'FAIL % : statement should have been rejected', p_label;
end $$;
grant execute on function public._expect_error(text, text) to anon, authenticated;

create or replace function public._expect(p_cond boolean, p_label text)
returns void language plpgsql as $$
begin
  if p_cond is not true then
    raise exception 'FAIL %', p_label;
  end if;
  raise notice 'ok   %', p_label;
end $$;
grant execute on function public._expect(boolean, text) to anon, authenticated;

-- ---------------------------------------------------------------- setup ----
insert into auth.users (id, email, raw_user_meta_data) values
  (:student1, 's1@test.local', '{"role":"student","full_name":"Sara Student","timezone":"Europe/Berlin"}'),
  (:student2, 's2@test.local', '{"role":"student","full_name":"Omar Other"}'),
  (:tutor,    't1@test.local', '{"role":"tutor","full_name":"Tina Tutor","timezone":"UTC"}'),
  (:admin,    'a@test.local',  '{"role":"admin","full_name":"Ada Admin"}'),
  (:tutor2,   't2@test.local', '{"role":"tutor","full_name":"Paul Pending","timezone":"Not/AZone"}');

select public._expect((select role from public.profiles where id = :admin) = 'student',
  'sign-up metadata cannot create an admin');
select public._expect((select timezone from public.profiles where id = :tutor2) = 'UTC',
  'invalid sign-up time zone falls back to UTC');
select public._expect((select status from public.tutor_profiles where id = :tutor) = 'draft',
  'tutor profile created as draft');

-- Promote admin out-of-band (what the README tells operators to do).
update public.profiles set role = 'admin' where id = :admin;

-- ---------------------------------------------------------------- anon -----
set role anon;
select set_config('request.jwt.claim.sub', '', false);

select public._expect((select count(*) from public.languages) = 7, 'anon reads languages');
select public._expect((select count(*) from public.profiles) = 0, 'anon cannot read private profiles');
select public._expect((select count(*) from public.tutor_profiles) = 0, 'anon cannot see draft tutors');
select public._expect_error($$insert into public.languages (code, name) values ('xx', 'X')$$, 'anon cannot add languages');
select public._expect_error($$select public.start_conversation('33333333-3333-3333-3333-333333333333')$$, 'anon cannot start conversations');

-- ---------------------------------------------------------------- tutor ----
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', :tutor, false);

select public._expect_error($$update public.tutor_profiles set status = 'pending' where id = auth.uid()$$,
  'incomplete tutor profile cannot be submitted');

update public.tutor_profiles
   set headline = 'Friendly English conversation coach',
       about = repeat('I help learners speak with confidence. ', 3),
       specialties = '{conversation,business}', levels_taught = '{A2,B1,B2}',
       hourly_rate_cents = 3000, lesson_durations = '{25,50}',
       avg_rating = 5, review_count = 999
 where id = auth.uid();
select public._expect((select review_count from public.tutor_profiles where id = auth.uid()) = 0,
  'tutor cannot fake review statistics');

insert into public.tutor_languages (tutor_id, language_code, teaches, is_native) values (auth.uid(), 'en', true, true);
insert into public.tutor_languages (tutor_id, language_code, teaches, is_native, proficiency) values (auth.uid(), 'de', false, false, 'B2');
insert into public.tutor_availability (tutor_id, weekday, start_minute, end_minute)
  select auth.uid(), d, 0, 1440 from generate_series(0, 6) d;

select public._expect_error($$insert into public.tutor_availability (tutor_id, weekday, start_minute, end_minute) values (auth.uid(), 1, 60, 120)$$,
  'overlapping availability windows rejected');
select public._expect_error($$update public.tutor_profiles set status = 'approved' where id = auth.uid()$$,
  'tutor cannot approve themselves');
select public._expect_error($$insert into public.tutor_languages (tutor_id, language_code) values ('55555555-5555-5555-5555-555555555555', 'fr')$$,
  'tutor cannot edit another tutor''s languages');

update public.tutor_profiles set status = 'pending' where id = auth.uid();
select public._expect((select status from public.tutor_profiles where id = auth.uid()) = 'pending', 'tutor submits for review');

-- ------------------------------------------------------------- student -----
select set_config('request.jwt.claim.sub', :student1, false);

select public._expect((select count(*) from public.tutor_profiles) = 0, 'students cannot see pending tutors');
select public._expect_error($$update public.profiles set role = 'admin' where id = auth.uid()$$, 'student cannot become admin');
update public.profiles set is_suspended = true, full_name = 'Sara S.' where id = auth.uid();
select public._expect((select not is_suspended and full_name = 'Sara S.' from public.profiles where id = auth.uid()),
  'student edits own profile but not protected columns');

do $$
declare n int;
begin
  update public.profiles set full_name = 'hacked' where id = '22222222-2222-2222-2222-222222222222';
  get diagnostics n = row_count;
  perform public._expect(n = 0, 'student cannot edit another profile');
  update public.tutor_profiles set hourly_rate_cents = 500 where id = '33333333-3333-3333-3333-333333333333';
  get diagnostics n = row_count;
  perform public._expect(n = 0, 'student cannot edit tutor information');
end $$;

select public._expect_error($$insert into public.favorites (student_id, tutor_id) values (auth.uid(), '33333333-3333-3333-3333-333333333333')$$,
  'cannot favorite an unapproved tutor');
select public._expect_error($$select public.admin_platform_stats()$$, 'student cannot read admin stats');

-- --------------------------------------------------------------- admin -----
select set_config('request.jwt.claim.sub', :admin, false);
update public.tutor_profiles set status = 'approved' where id = :tutor;
select public._expect((select status from public.tutor_profiles where id = :tutor) = 'approved', 'admin approves tutor');
select public._expect((select (public.admin_platform_stats() ->> 'tutors_approved')::int) = 1, 'admin reads stats');

-- ---------------------------------------------------------- discovery ------
reset role;
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select public._expect((select count(*) from public.search_tutors()) = 1, 'anon finds approved tutor');
select public._expect((select count(*) from public.search_tutors(p_teaches => 'en', p_native => 'en', p_level => 'B1')) = 1, 'filters match');
select public._expect((select count(*) from public.search_tutors(p_teaches => 'fr')) = 0, 'language filter excludes');
select public._expect((select count(*) from public.search_tutors(p_min_rating => 4)) = 0, 'rating filter ignores unrated tutors');
select public._expect((select count(*) from public.profiles) = 1, 'anon sees approved tutor profile only');
select public._expect((select count(*) from public.get_tutor_slots(:tutor, now(), now() + interval '3 days', 50)) > 0, 'slots are generated');
select public._expect((select count(*) from public.get_tutor_slots(:tutor, now(), now() + interval '3 days', 60)) = 0, 'unsupported duration has no slots');

-- ------------------------------------------------------------- bookings ----
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', :student1, false);

create temp table t_slot as
  select starts_at from public.get_tutor_slots(:tutor, now() + interval '1 day', now() + interval '2 days', 50) limit 1;
grant select on t_slot to authenticated;

select public._expect_error($$insert into public.bookings (student_id, tutor_id, language_code, duration_minutes, starts_at, ends_at, hourly_rate_cents, price_cents, currency)
  values (auth.uid(), '33333333-3333-3333-3333-333333333333', 'en', 50, now() + interval '2 days', now() + interval '2 days 50 minutes', 0, 0, 'USD')$$,
  'direct booking inserts are blocked');
select public._expect_error($$select public.request_booking('33333333-3333-3333-3333-333333333333', 'de', 'conversation', 50, (select starts_at from t_slot))$$,
  'cannot book a language the tutor does not teach');
select public._expect_error($$select public.request_booking('33333333-3333-3333-3333-333333333333', 'en', 'conversation', 50, now() + interval '1 hour')$$,
  'cannot book inside the minimum notice period');

create temp table t_booking as
  select public.request_booking(:tutor, 'en', 'conversation', 50, (select starts_at from t_slot), 'Hi!') as id;
grant select on t_booking to authenticated;
select public._expect((select price_cents = 2500 and status = 'pending' from public.bookings where id = (select id from t_booking)),
  'booking stored as pending with correct price snapshot');

select public._expect_error($$select public.respond_booking((select id from t_booking), true)$$, 'student cannot confirm own booking');

select set_config('request.jwt.claim.sub', :student2, false);
select public._expect((select count(*) from public.bookings) = 0, 'other student cannot see the booking');
select public._expect_error($$select public.request_booking('33333333-3333-3333-3333-333333333333', 'en', 'conversation', 25, (select starts_at from t_slot))$$,
  'double booking the same slot is rejected');
select public._expect_error($$select public.cancel_booking((select id from t_booking))$$, 'other student cannot cancel the booking');

select set_config('request.jwt.claim.sub', :tutor, false);
select public.respond_booking((select id from t_booking), true);
select public._expect((select status from public.bookings where id = (select id from t_booking)) = 'confirmed', 'tutor confirms booking');
select public._expect_error($$select public.complete_booking((select id from t_booking))$$, 'cannot complete a lesson before it ends');

-- Even code that bypasses the RPC checks (e.g. a race between two requests)
-- cannot create overlapping active bookings: the exclusion constraint wins.
reset role;
select public._expect_error($$insert into public.bookings (student_id, tutor_id, language_code, duration_minutes, starts_at, ends_at, hourly_rate_cents, price_cents, currency)
  select '22222222-2222-2222-2222-222222222222', tutor_id, 'en', 25, starts_at + interval '10 minutes', starts_at + interval '35 minutes', 3000, 1250, 'USD'
  from public.bookings where id = (select id from t_booking)$$,
  'exclusion constraint blocks overlapping bookings at the database level');
set role authenticated;
select set_config('request.jwt.claim.sub', :tutor, false);

-- ---------------------------------------------------------- messaging ------
select set_config('request.jwt.claim.sub', :student1, false);
create temp table t_conv as select public.start_conversation(:tutor) as id;
grant select on t_conv to authenticated;
select public._expect((select public.start_conversation(:tutor)) = (select id from t_conv), 'existing conversation is reused');
insert into public.messages (conversation_id, sender_id, body) values ((select id from t_conv), auth.uid(), 'Hello tutor');
select public._expect_error($$insert into public.messages (conversation_id, sender_id, body) values ((select id from t_conv), '33333333-3333-3333-3333-333333333333', 'spoof')$$,
  'cannot send messages as someone else');
select public._expect_error($$select public.start_conversation('22222222-2222-2222-2222-222222222222')$$,
  'student cannot cold-message another student');

select set_config('request.jwt.claim.sub', :student2, false);
select public._expect((select count(*) from public.messages) = 0, 'non-participant cannot read messages');
select public._expect((select count(*) from public.conversations) = 0, 'non-participant cannot see the conversation');
select public._expect_error($$insert into public.messages (conversation_id, sender_id, body) values ((select id from t_conv), auth.uid(), 'intrude')$$,
  'non-participant cannot post');

select set_config('request.jwt.claim.sub', :tutor, false);
select public._expect((select unread_count from public.get_my_conversations() limit 1) = 1, 'tutor sees unread count');
select public._expect((select count(*) from public.notifications where type = 'message') = 1, 'tutor notified of new message');
select public.mark_conversation_read((select id from t_conv));
select public._expect((select unread_count from public.get_my_conversations() limit 1) = 0, 'mark as read clears unread');

-- ------------------------------------------------------------- reviews -----
select set_config('request.jwt.claim.sub', :student1, false);
select public._expect_error($$insert into public.reviews (booking_id, tutor_id, student_id, rating) values ((select id from t_booking), '33333333-3333-3333-3333-333333333333', auth.uid(), 5)$$,
  'cannot review a lesson that is not completed');

reset role;
update public.bookings set starts_at = now() - interval '2 hours', ends_at = now() - interval '70 minutes' where id = (select id from t_booking);
set role authenticated;

select set_config('request.jwt.claim.sub', :student1, false);
select public._expect_error($$select public.complete_booking((select id from t_booking))$$, 'student cannot mark lesson completed');

select set_config('request.jwt.claim.sub', :tutor, false);
select public.complete_booking((select id from t_booking));
select public._expect_error($$insert into public.reviews (booking_id, tutor_id, student_id, rating) values ((select id from t_booking), auth.uid(), auth.uid(), 5)$$,
  'tutor cannot review themselves');

select set_config('request.jwt.claim.sub', :student1, false);
insert into public.reviews (booking_id, tutor_id, student_id, rating, comment, status)
  values ((select id from t_booking), :tutor, auth.uid(), 4, 'Great conversation practice', 'hidden');
select public._expect((select status from public.reviews limit 1) = 'published', 'students cannot set moderation status');
select public._expect_error($$insert into public.reviews (booking_id, tutor_id, student_id, rating) values ((select id from t_booking), '33333333-3333-3333-3333-333333333333', auth.uid(), 5)$$,
  'duplicate review rejected');

select set_config('request.jwt.claim.sub', :student2, false);
select public._expect((select avg_rating = 4 and review_count = 1 and completed_lessons = 1 from public.tutor_profiles where id = :tutor),
  'rating aggregates updated');
select public._expect((select reviewer_name from public.get_tutor_reviews(:tutor) limit 1) = 'Sara S.', 'review shows reduced reviewer name');

select set_config('request.jwt.claim.sub', :admin, false);
update public.reviews set status = 'hidden';
select public._expect((select review_count from public.tutor_profiles where id = :tutor) = 0, 'admin moderation updates aggregates');

-- --------------------------------------------------- favorites / misc ------
select set_config('request.jwt.claim.sub', :student1, false);
insert into public.favorites (student_id, tutor_id) values (auth.uid(), :tutor);
select public._expect((select count(*) from public.favorites) = 1, 'student favorites approved tutor');
select set_config('request.jwt.claim.sub', :student2, false);
select public._expect((select count(*) from public.favorites) = 0, 'favorites are private');

select public._expect_error($$update public.notifications set title = 'x'$$, 'notification content is read-only');
select public._expect_error($$insert into public.reports (reporter_id, reported_user_id, reason, status) values (auth.uid(), '33333333-3333-3333-3333-333333333333', 'spam', 'resolved')$$,
  'reports cannot be created as resolved');
insert into public.reports (reporter_id, reported_user_id, reason) values (auth.uid(), :tutor, 'spam');

select set_config('request.jwt.claim.sub', :tutor, false);
select public._expect((select count(*) from public.reports) = 0, 'reports are private to reporter and admins');
select public._expect((select count(*) from public.profiles where id = :student1) = 1, 'tutor can see their student''s profile');
select public._expect((select count(*) from public.profiles where id = :student2) = 0, 'tutor cannot see unrelated students');

-- --------------------------------------------------------------- storage ---
select set_config('request.jwt.claim.sub', :student1, false);
insert into storage.objects (bucket_id, name) values ('avatars', '11111111-1111-1111-1111-111111111111/avatar.png');
select public._expect_error($$insert into storage.objects (bucket_id, name) values ('avatars', '22222222-2222-2222-2222-222222222222/avatar.png')$$,
  'cannot upload into another user''s avatar folder');
select public._expect_error($$insert into storage.objects (bucket_id, name) values ('tutor-documents', '11111111-1111-1111-1111-111111111111/cert.pdf')$$,
  'students cannot upload tutor documents');

reset role;
\echo
\echo 'All authorization tests passed.'
