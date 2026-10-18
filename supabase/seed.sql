-- =============================================================================
-- DEMO DATA (local development only)
--
-- These tutors are fictional and flagged with tutor_profiles.is_demo = true.
-- The UI shows a "Demo profile" badge, and the database refuses bookings and
-- messages to them. They have no reviews or ratings: nothing here pretends to
-- be real feedback. Prices are illustrative placeholders.
--
-- Demo accounts have no password and cannot sign in.
-- Remove them at any time with:
--   delete from auth.users where email like '%@demo.lingora.invalid';
-- =============================================================================

insert into auth.users (id, email, raw_user_meta_data) values
  ('d0000000-0000-4000-8000-000000000001', 'emma@demo.lingora.invalid',   '{"role":"tutor","full_name":"Emma Clarke (Demo)","timezone":"Europe/London"}'),
  ('d0000000-0000-4000-8000-000000000002', 'lukas@demo.lingora.invalid',  '{"role":"tutor","full_name":"Lukas Weber (Demo)","timezone":"Europe/Berlin"}'),
  ('d0000000-0000-4000-8000-000000000003', 'camille@demo.lingora.invalid','{"role":"tutor","full_name":"Camille Laurent (Demo)","timezone":"Europe/Paris"}'),
  ('d0000000-0000-4000-8000-000000000004', 'giulia@demo.lingora.invalid', '{"role":"tutor","full_name":"Giulia Rossi (Demo)","timezone":"Europe/Rome"}'),
  ('d0000000-0000-4000-8000-000000000005', 'mateo@demo.lingora.invalid',  '{"role":"tutor","full_name":"Mateo García (Demo)","timezone":"Europe/Madrid"}'),
  ('d0000000-0000-4000-8000-000000000006', 'layla@demo.lingora.invalid',  '{"role":"tutor","full_name":"Layla Haddad (Demo)","timezone":"Asia/Amman"}'),
  ('d0000000-0000-4000-8000-000000000007', 'joao@demo.lingora.invalid',   '{"role":"tutor","full_name":"João Ferreira (Demo)","timezone":"Europe/Lisbon"}')
on conflict (id) do nothing;

update public.profiles p set country = v.country, onboarded = true
from (values
  ('d0000000-0000-4000-8000-000000000001'::uuid, 'GB'),
  ('d0000000-0000-4000-8000-000000000002'::uuid, 'DE'),
  ('d0000000-0000-4000-8000-000000000003'::uuid, 'FR'),
  ('d0000000-0000-4000-8000-000000000004'::uuid, 'IT'),
  ('d0000000-0000-4000-8000-000000000005'::uuid, 'ES'),
  ('d0000000-0000-4000-8000-000000000006'::uuid, 'JO'),
  ('d0000000-0000-4000-8000-000000000007'::uuid, 'PT')
) as v(id, country)
where p.id = v.id;

update public.tutor_profiles tp set
  headline = v.headline,
  about = v.about || E'\n\nThis is a demo profile used to preview the marketplace. It cannot be booked or messaged.',
  teaching_experience_years = v.years,
  specialties = v.specialties,
  levels_taught = v.levels::public.cefr_level[],
  hourly_rate_cents = v.rate,
  lesson_durations = v.durations,
  status = 'approved',
  is_demo = true
from (values
  ('d0000000-0000-4000-8000-000000000001'::uuid, 'Everyday English conversation and interview practice',
   'I focus on natural conversation, pronunciation and the confidence to speak without translating in your head.',
   6, '{conversation,pronunciation,interview}'::text[], '{A2,B1,B2,C1}', 2800, '{25,50}'::int[]),
  ('d0000000-0000-4000-8000-000000000002'::uuid, 'German for work, relocation and daily life',
   'Structured German lessons with lots of speaking time. Ideal if you are moving to a German-speaking country.',
   4, '{business,relocation,grammar}'::text[], '{A1,A2,B1,B2}', 3200, '{50,60}'::int[]),
  ('d0000000-0000-4000-8000-000000000003'::uuid, 'Speak French with confidence, from first words to fluency',
   'Patient and practical lessons built around real situations: ordering food, small talk, work meetings.',
   8, '{conversation,beginners,exam_prep}'::text[], '{A1,A2,B1,B2,C1,C2}', 3000, '{25,50,60}'::int[]),
  ('d0000000-0000-4000-8000-000000000004'::uuid, 'Italian conversation for travellers and culture lovers',
   'We will talk about food, art, travel and everyday life while building your vocabulary and listening skills.',
   3, '{conversation,travel,culture}'::text[], '{A1,A2,B1}', 2200, '{25,50}'::int[]),
  ('d0000000-0000-4000-8000-000000000005'::uuid, 'Spanish fluency coaching with a focus on listening',
   'Lessons adapted to your goals, with clear explanations and plenty of guided speaking practice.',
   5, '{conversation,pronunciation,business}'::text[], '{A2,B1,B2,C1}', 2500, '{25,50}'::int[]),
  ('d0000000-0000-4000-8000-000000000006'::uuid, 'Modern Standard Arabic and Levantine dialect',
   'Learn to read, write and speak Arabic step by step, including everyday Levantine expressions.',
   7, '{beginners,dialects,conversation}'::text[], '{A1,A2,B1,B2}', 2400, '{50,60}'::int[]),
  ('d0000000-0000-4000-8000-000000000007'::uuid, 'European and Brazilian Portuguese conversation',
   'Relaxed conversation lessons that help you understand both European and Brazilian accents.',
   2, '{conversation,travel,beginners}'::text[], '{A1,A2,B1}', 2000, '{25,50}'::int[])
) as v(id, headline, about, years, specialties, levels, rate, durations)
where tp.id = v.id;

insert into public.tutor_languages (tutor_id, language_code, teaches, is_native, proficiency) values
  ('d0000000-0000-4000-8000-000000000001', 'en', true,  true,  null),
  ('d0000000-0000-4000-8000-000000000001', 'fr', false, false, 'B2'),
  ('d0000000-0000-4000-8000-000000000002', 'de', true,  true,  null),
  ('d0000000-0000-4000-8000-000000000002', 'en', true,  false, 'C1'),
  ('d0000000-0000-4000-8000-000000000003', 'fr', true,  true,  null),
  ('d0000000-0000-4000-8000-000000000003', 'es', false, false, 'B1'),
  ('d0000000-0000-4000-8000-000000000004', 'it', true,  true,  null),
  ('d0000000-0000-4000-8000-000000000005', 'es', true,  true,  null),
  ('d0000000-0000-4000-8000-000000000005', 'pt', true,  false, 'C1'),
  ('d0000000-0000-4000-8000-000000000006', 'ar', true,  true,  null),
  ('d0000000-0000-4000-8000-000000000006', 'en', false, false, 'C1'),
  ('d0000000-0000-4000-8000-000000000007', 'pt', true,  true,  null),
  ('d0000000-0000-4000-8000-000000000007', 'es', false, false, 'B2')
on conflict do nothing;

-- Weekday evenings + weekend mornings in each tutor's own time zone.
insert into public.tutor_availability (tutor_id, weekday, start_minute, end_minute)
select t.id, d.weekday, d.start_minute, d.end_minute
from (select id from public.tutor_profiles where is_demo) t
cross join (values
  (1, 1020, 1260), (2, 1020, 1260), (3, 1020, 1260), (4, 1020, 1260), (5, 960, 1200),
  (6, 540, 780), (0, 600, 780)
) as d(weekday, start_minute, end_minute)
on conflict do nothing;
