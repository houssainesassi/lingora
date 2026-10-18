# Lingora: language tutor marketplace

Students find language tutors and native speakers, message them, book lessons and join one-to-one voice or video calls.

Built with Next.js 16 (App Router, TypeScript strict), Supabase (Postgres, Auth, Storage, Realtime), Tailwind CSS 4, LiveKit and Lucide icons. Designed for deployment on Vercel.

## Features

- **Auth:** sign up as student or tutor, login, logout, password reset, email confirmation, onboarding and protected routes. Uses `@supabase/ssr` with a session-refreshing `src/proxy.ts`.
- **Tutor discovery:** search by name and filter by language taught, native language, country, CEFR level, specialty, price and rating, with sorting and pagination. Only approved tutors are listed.
- **Tutor profiles:** bio, languages and levels, experience, certifications, specialties, prices per duration, weekly availability and verified reviews.
- **Favorites.**
- **Real-time messaging:** one-to-one conversations (reused when the pair already has one), history with pagination, timestamps, unread counts, "seen" indicator and live delivery via Supabase Realtime.
- **Bookings:** lesson type, 25/50/60 minute durations, time slots computed from availability in the viewer's time zone, and a price snapshot. Covers request, accept/decline, cancel, reschedule proposal and accept, and completion. Double-booking is blocked by Postgres exclusion constraints.
- **Video and voice lessons:** LiveKit rooms per booking. Tokens are issued server-side only to participants of confirmed lessons inside the time window. Includes mic and camera controls, connection status, a timer, device-error handling and no recording.
- **Dashboards:** student (goals, languages, levels, favorites, lessons, hours, messages, notifications), tutor (completion checklist, approval status, availability, requests, lessons, reviews, lesson-value stats) and admin (tutor approval, users, bookings, reports, review moderation, languages, statistics).
- **Reviews:** one per completed booking, never for yourself, with aggregates kept in sync by triggers.
- **Notifications:** created by database triggers and delivered live to the header bell.
- **Reports and moderation.**
- **Payments:** not implemented. Prices are displayed and stored per booking, the UI says clearly that nothing is charged, and a `platform_commission_percent` setting is reserved for later.

## Project layout

```
src/app/                 routes (Server Components by default)
src/components/          UI primitives, layout, feature components
src/lib/                 auth helpers, Supabase clients, validation, utils
src/proxy.ts             session refresh + redirect for private routes
supabase/migrations/     schema, RLS/security, business functions, storage/realtime
supabase/seed.sql        DEMO tutors (flagged is_demo, no reviews, not bookable)
supabase/tests/          authorization test-suite (runs in a throwaway Docker Postgres)
```

## Environment variables

Copy `.env.example` to `.env.local`:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | Publishable key (or set the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
| `NEXT_PUBLIC_SITE_URL` | production | Used in auth email links |
| `LIVEKIT_URL` | for calls | e.g. `wss://xxx.livekit.cloud` (server-only) |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | for calls | Server-only, never sent to the browser |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | optional | Shown on /contact |

The Supabase **service-role key is not used**. All access goes through the user's session and Row Level Security.

If the Supabase variables are missing the app still builds and shows a "setup required" banner.

## Option A: run fully local (Supabase CLI + Docker)

Requires Docker and roughly 3 GB of free RAM.

```bash
npm install
npx supabase start          # starts local Supabase, applies migrations + seed.sql
npx supabase status         # copy "API URL" and "Publishable key" into .env.local
npm run dev                 # http://localhost:3000
```

Local auth emails (confirmation and password reset) arrive in Mailpit at http://localhost:54324. Email confirmation is disabled locally by default.

## Option B: Supabase Cloud

1. Create a project at supabase.com.
2. Apply the migrations, in order, with either method:
   - `npx supabase login && npx supabase link --project-ref <ref> && npx supabase db push`, or
   - paste each file in `supabase/migrations/` into the SQL editor, in filename order.
3. Optionally run `supabase/seed.sql` in the SQL editor to add the demo tutors. Skip it in production.
4. Under **Authentication → URL configuration**, set the Site URL to your domain and add `https://your-domain/**` (and `http://localhost:3000/**`) to the redirect URLs.
5. Recommended: in **Authentication → Email templates**, use links of the form `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup` (use `type=recovery` for reset). The default PKCE links also work.
6. Put the URL and publishable key in `.env.local` and run `npm run dev`.

The migrations create the `avatars` (public) and `tutor-documents` (private) storage buckets with policies. They also add `messages` and `notifications` to the `supabase_realtime` publication.

### Creating the first admin

Admin rights cannot be granted through sign-up or the API. Sign up normally, then run this in the SQL editor:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

Further admins can then be promoted from **Admin → Users**.

## LiveKit setup (voice/video)

1. Create a LiveKit Cloud project at cloud.livekit.io (or self-host LiveKit).
2. Copy the WebSocket URL, API key and API secret into `LIVEKIT_URL`, `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`.
3. Restart the dev server or redeploy. Without these, the lesson room shows "Video calls are not configured" and `/api/livekit/token` returns 503.

The room opens `join_early_minutes` (default 10) before start and closes 10 minutes after the end. Recording is not enabled.

## Commands

```bash
npm run dev        # development server
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run db:test    # migrations + authorization tests in a disposable Docker Postgres
```

`npm run db:test` never touches a Supabase project. It starts a temporary `postgres:16` container with a small stub of Supabase's auth and storage schemas, applies every migration and the seed, and then checks the rules for anonymous users, students, tutors and admins. That covers RLS, privilege escalation, booking overlaps, messaging participation, review eligibility and storage folders.

## Deploying to Vercel

1. Push the repo to GitHub and import it in Vercel. The framework is detected automatically.
2. Add the environment variables from the table above for Production and Preview. Set `NEXT_PUBLIC_SITE_URL` to the production URL.
3. Add the Vercel domain to Supabase **Authentication → URL configuration**.
4. Deploy.

## Business rules (enforced in the database)

- Tutors appear publicly only with `status = 'approved'`. Tutors can only move draft/rejected → pending, and only admins approve, reject or suspend.
- Bookings are created and changed only through SECURITY DEFINER functions (`request_booking`, `respond_booking`, `cancel_booking`, `request_reschedule`, `respond_reschedule`, `complete_booking`). Direct table writes are revoked.
- Exclusion constraints prevent overlapping pending or confirmed lessons per tutor and per student, even under concurrent requests.
- Settings in `platform_settings` cover minimum notice (12h), booking horizon (60 days), the student cancellation window for confirmed lessons (24h) and the call join window.
- Only participants read conversations and messages. `sender_id` must be the caller.
- Reviews require a completed booking by the reviewer, are limited to one per booking, and are never for yourself. Moderation status is admin-only.

## Status

| Area | Status |
| --- | --- |
| Schema, RLS, booking/messaging/review rules | Implemented and covered by `npm run db:test` |
| Build, type-check, lint | Passing |
| Auth, discovery, profiles, messaging, bookings, dashboards, admin | Implemented. Needs a Supabase project (local or cloud) to run |
| Voice/video lessons | Implemented. Needs LiveKit credentials |
| Payments | Not implemented. Prices are stored per booking for a future Stripe integration |
| Demo data | `supabase/seed.sql` only, clearly labelled, not bookable |
