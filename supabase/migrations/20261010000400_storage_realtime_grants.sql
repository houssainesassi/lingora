-- =============================================================================
-- Lingora: storage buckets + policies, realtime publication, function grants
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Storage
--   avatars          public read, users write only inside "<their uid>/"
--   tutor-documents  private, tutors manage their own files, admins can read
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('tutor-documents', 'tutor-documents', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'avatars');

create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "tutor_docs_read_own_or_admin" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'tutor-documents'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
  );

create policy "tutor_docs_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'tutor-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'tutor')
  );

create policy "tutor_docs_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'tutor-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- -----------------------------------------------------------------------------
-- Realtime: postgres_changes respects RLS, so subscribers only receive rows
-- they are allowed to select.
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Function privileges. Postgres grants EXECUTE to PUBLIC by default; tighten
-- internal helpers and keep write RPCs for signed-in users only.
-- -----------------------------------------------------------------------------
revoke execute on function public.is_bookable_slot(uuid, timestamptz, integer, uuid) from public, anon, authenticated;
revoke execute on function public.assert_active_user() from public, anon;
revoke execute on function public.setting_int(text, integer) from public, anon, authenticated;

revoke execute on function public.request_booking(uuid, text, public.lesson_type, integer, timestamptz, text) from public, anon;
revoke execute on function public.respond_booking(uuid, boolean, text) from public, anon;
revoke execute on function public.cancel_booking(uuid, text) from public, anon;
revoke execute on function public.request_reschedule(uuid, timestamptz) from public, anon;
revoke execute on function public.respond_reschedule(uuid, boolean) from public, anon;
revoke execute on function public.complete_booking(uuid) from public, anon;
revoke execute on function public.start_conversation(uuid) from public, anon;
revoke execute on function public.mark_conversation_read(uuid) from public, anon;
revoke execute on function public.get_my_conversations(integer) from public, anon;
revoke execute on function public.admin_platform_stats() from public, anon;

grant execute on function public.request_booking(uuid, text, public.lesson_type, integer, timestamptz, text) to authenticated;
grant execute on function public.respond_booking(uuid, boolean, text) to authenticated;
grant execute on function public.cancel_booking(uuid, text) to authenticated;
grant execute on function public.request_reschedule(uuid, timestamptz) to authenticated;
grant execute on function public.respond_reschedule(uuid, boolean) to authenticated;
grant execute on function public.complete_booking(uuid) to authenticated;
grant execute on function public.start_conversation(uuid) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.get_my_conversations(integer) to authenticated;
grant execute on function public.admin_platform_stats() to authenticated;
grant execute on function public.assert_active_user() to authenticated;

-- Helpers referenced by RLS policies and guard triggers.
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_end_user_context() to anon, authenticated;
grant execute on function public.is_conversation_participant(uuid) to authenticated;
grant execute on function public.can_view_profile(uuid) to anon, authenticated;

grant execute on function public.search_tutors(text, text, text, text, public.cefr_level, text, integer, integer, numeric, text, integer, integer) to anon, authenticated;
grant execute on function public.get_tutor_reviews(uuid, integer, integer) to anon, authenticated;
grant execute on function public.get_tutor_slots(uuid, timestamptz, timestamptz, integer, uuid) to anon, authenticated;
