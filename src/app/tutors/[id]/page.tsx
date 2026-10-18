import { Award, BookOpen, Clock, Globe2, GraduationCap, Languages, MessageSquareQuote } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { BookingWidget } from "@/app/tutors/[id]/booking-widget";
import { FavoriteButton } from "@/components/tutors/favorite-button";
import { MessageButton } from "@/components/tutors/message-button";
import { ButtonLink } from "@/components/ui/button";
import { Alert, Avatar, Badge, Card, CardHeader, Container, EmptyState } from "@/components/ui/primitives";
import { RatingSummary, Stars } from "@/components/ui/rating";
import { getSessionUser } from "@/lib/auth";
import { CEFR_DESCRIPTIONS, LESSON_TYPE_LABEL, SPECIALTY_LABEL, WEEKDAYS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { countryFlag, countryName, formatPrice, formatRelative, minutesToLabel } from "@/lib/utils";
import { uuidSchema } from "@/lib/validation";

const loadTutor = cache(async (id: string) => {
  if (!uuidSchema.safeParse(id).success) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("tutor_profiles")
    .select("*, profile:profiles!tutor_profiles_id_fkey(full_name, avatar_url, country, timezone, role, is_suspended), tutor_languages(language_code, teaches, is_native, proficiency, language:languages(name))")
    .eq("id", id)
    .maybeSingle();
  return data;
});

export async function generateMetadata({ params }: PageProps<"/tutors/[id]">): Promise<Metadata> {
  const { id } = await params;
  const tutor = await loadTutor(id);
  if (!tutor?.profile) return { title: "Tutor not found" };
  return { title: `${tutor.profile.full_name}: ${tutor.headline}`, description: tutor.about.slice(0, 160) };
}

export default async function TutorProfilePage({ params }: PageProps<"/tutors/[id]">) {
  const { id } = await params;
  const [tutor, user] = await Promise.all([loadTutor(id), getSessionUser()]);
  if (!tutor?.profile) notFound();

  const supabase = await createClient();
  const isSelf = user?.id === tutor.id;
  const isPublic = tutor.status === "approved" && !tutor.profile.is_suspended;

  const [{ data: reviews }, { data: availability }, favorite, trial] = await Promise.all([
    supabase.rpc("get_tutor_reviews", { p_tutor_id: tutor.id, p_limit: 10 }),
    supabase.from("tutor_availability").select("weekday, start_minute, end_minute").eq("tutor_id", tutor.id).order("weekday").order("start_minute"),
    user ? supabase.from("favorites").select("tutor_id").eq("student_id", user.id).eq("tutor_id", tutor.id).maybeSingle() : Promise.resolve({ data: null }),
    user
      ? supabase.from("bookings").select("id").eq("student_id", user.id).eq("tutor_id", tutor.id).eq("lesson_type", "trial").in("status", ["pending", "confirmed", "completed"]).limit(1)
      : Promise.resolve({ data: [] as { id: string }[] }),
  ]);

  const langs = tutor.tutor_languages.map((l) => ({ ...l, name: l.language?.name ?? l.language_code }));
  const teaches = langs.filter((l) => l.teaches);
  const native = langs.filter((l) => l.is_native);
  const others = langs.filter((l) => !l.is_native);
  const name = tutor.profile.full_name;
  const returnTo = `/tutors/${tutor.id}`;

  return (
    <Container className="py-10">
      {!isPublic ? (
        <Alert tone="warning" className="mb-6" title="This profile is not public">
          {isSelf ? "Students cannot see your profile until an administrator approves it." : `Status: ${tutor.status}. Only you and administrators can see it.`}
        </Alert>
      ) : null}
      {tutor.is_demo ? (
        <Alert tone="warning" className="mb-6" title="Demo profile">
          This fictional profile is sample data for previewing the marketplace. It has no real reviews and cannot be booked or messaged.
        </Alert>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <Card className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row">
              <Avatar src={tutor.profile.avatar_url} name={name} size={120} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
                    <p className="text-muted-foreground">
                      {tutor.profile.country ? (
                        <>
                          <span aria-hidden="true">{countryFlag(tutor.profile.country)} </span>
                          {countryName(tutor.profile.country)}
                        </>
                      ) : null}
                    </p>
                  </div>
                  {!isSelf && isPublic ? <FavoriteButton tutorId={tutor.id} tutorName={name} initial={Boolean(favorite.data)} withLabel /> : null}
                </div>
                <p className="mt-3 text-lg font-medium">{tutor.headline}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                  <RatingSummary rating={tutor.avg_rating} count={tutor.review_count} />
                  <span className="text-muted-foreground">{tutor.completed_lessons} completed lessons</span>
                  <span className="text-muted-foreground">
                    {tutor.teaching_experience_years} year{tutor.teaching_experience_years === 1 ? "" : "s"} teaching
                  </span>
                </div>
                {tutor.specialties.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Specialties">
                    {tutor.specialties.map((s) => (
                      <li key={s}>
                        <Badge tone="primary">{SPECIALTY_LABEL[s] ?? s}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
            {isSelf ? (
              <div className="mt-5 flex gap-2 border-t border-border pt-5">
                <ButtonLink href="/dashboard/tutor/profile" variant="secondary">
                  Edit profile
                </ButtonLink>
                <ButtonLink href="/dashboard/tutor/availability" variant="secondary">
                  Edit availability
                </ButtonLink>
              </div>
            ) : null}
          </Card>

          <Card>
            <CardHeader title="About me" />
            <div className="whitespace-pre-line px-5 py-4 text-sm leading-relaxed">{tutor.about || "This tutor has not written an introduction yet."}</div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader title="Languages" />
              <dl className="space-y-3 px-5 py-4 text-sm">
                <div className="flex gap-3">
                  <dt className="flex w-24 shrink-0 items-center gap-1.5 text-muted-foreground">
                    <Languages className="size-4" aria-hidden="true" /> Teaches
                  </dt>
                  <dd className="font-medium">{teaches.map((l) => l.name).join(", ") || "—"}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="flex w-24 shrink-0 items-center gap-1.5 text-muted-foreground">
                    <Globe2 className="size-4" aria-hidden="true" /> Native
                  </dt>
                  <dd className="font-medium">{native.map((l) => l.name).join(", ") || "—"}</dd>
                </div>
                {others.length > 0 ? (
                  <div className="flex gap-3">
                    <dt className="flex w-24 shrink-0 items-center gap-1.5 text-muted-foreground">
                      <BookOpen className="size-4" aria-hidden="true" /> Also speaks
                    </dt>
                    <dd>
                      {others.map((l) => (
                        <span key={l.language_code} className="mr-3 inline-block">
                          {l.name} <Badge className="ml-1">{l.proficiency}</Badge>
                        </span>
                      ))}
                    </dd>
                  </div>
                ) : null}
                <div className="flex gap-3">
                  <dt className="flex w-24 shrink-0 items-center gap-1.5 text-muted-foreground">
                    <GraduationCap className="size-4" aria-hidden="true" /> Levels
                  </dt>
                  <dd className="flex flex-wrap gap-1">
                    {tutor.levels_taught.length > 0
                      ? tutor.levels_taught.map((l) => (
                          <Badge key={l} title={CEFR_DESCRIPTIONS[l]}>
                            {l}
                          </Badge>
                        ))
                      : "—"}
                  </dd>
                </div>
              </dl>
            </Card>

            <Card>
              <CardHeader title="Lessons" />
              <div className="space-y-3 px-5 py-4 text-sm">
                <p className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
                  {[...tutor.lesson_durations].sort((a, b) => a - b).map((d) => `${d} min`).join(" · ")}
                </p>
                <ul className="space-y-1">
                  {[...tutor.lesson_durations]
                    .sort((a, b) => a - b)
                    .map((d) => (
                      <li key={d} className="flex justify-between">
                        <span className="text-muted-foreground">{d} minute lesson</span>
                        <span className="font-medium">{formatPrice(Math.round((tutor.hourly_rate_cents * d) / 60), tutor.currency)}</span>
                      </li>
                    ))}
                </ul>
                {tutor.certifications ? (
                  <div className="border-t border-border pt-3">
                    <p className="flex items-center gap-2 font-medium">
                      <Award className="size-4 text-muted-foreground" aria-hidden="true" /> Certifications
                    </p>
                    <p className="mt-1 whitespace-pre-line text-muted-foreground">{tutor.certifications}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Provided by the tutor.</p>
                  </div>
                ) : null}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Weekly availability" description={`In the tutor’s time zone (${tutor.profile.timezone.replaceAll("_", " ")}). Use the booking panel to see times in your own time zone.`} />
            <ul className="divide-y divide-border px-5 text-sm">
              {WEEKDAYS.map((day, i) => {
                const windows = (availability ?? []).filter((a) => a.weekday === i);
                return (
                  <li key={day} className="flex justify-between gap-4 py-2.5">
                    <span className="w-24 font-medium">{day}</span>
                    <span className="text-right text-muted-foreground">
                      {windows.length ? windows.map((w) => `${minutesToLabel(w.start_minute)}–${minutesToLabel(w.end_minute)}`).join(", ") : "Unavailable"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Reviews" description="Only students who completed a lesson can leave a review." action={<RatingSummary rating={tutor.avg_rating} count={tutor.review_count} />} />
            {reviews && reviews.length > 0 ? (
              <ul className="divide-y divide-border">
                {reviews.map((r) => (
                  <li key={r.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Stars value={r.rating} />
                        <span className="text-sm font-medium">{r.reviewer_name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {LESSON_TYPE_LABEL[r.lesson_type]} · {formatRelative(r.created_at)}
                      </span>
                    </div>
                    {r.comment ? <p className="mt-2 whitespace-pre-line text-sm">{r.comment}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5">
                <EmptyState icon={<MessageSquareQuote />} title="No reviews yet" description="Reviews appear here after students complete lessons with this tutor." />
              </div>
            )}
          </Card>
        </div>

        <aside id="book" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">Book a lesson</h2>
              <p>
                <span className="text-xl font-semibold">{formatPrice(tutor.hourly_rate_cents, tutor.currency)}</span>
                <span className="text-sm text-muted-foreground"> / hour</span>
              </p>
            </div>
            <div className="mt-4">
              {isSelf ? (
                <p className="text-sm text-muted-foreground">This is your own profile. Students will see the booking form here.</p>
              ) : tutor.is_demo ? (
                <p className="text-sm text-muted-foreground">Booking is disabled for demo profiles.</p>
              ) : !isPublic ? (
                <p className="text-sm text-muted-foreground">This tutor is not accepting bookings right now.</p>
              ) : (
                <BookingWidget
                  tutorId={tutor.id}
                  tutorName={name}
                  hourlyRateCents={tutor.hourly_rate_cents}
                  currency={tutor.currency}
                  durations={tutor.lesson_durations}
                  languages={teaches.map((l) => ({ code: l.language_code, name: l.name }))}
                  signedIn={Boolean(user)}
                  viewerTimeZone={user?.profile.timezone ?? null}
                  hasTrial={(trial.data ?? []).length > 0}
                />
              )}
            </div>
            {!isSelf && isPublic && !tutor.is_demo ? (
              <div className="mt-4 border-t border-border pt-4">
                <MessageButton userId={tutor.id} returnTo={returnTo} label={`Message ${name.split(" ")[0]}`} />
              </div>
            ) : null}
          </Card>
        </aside>
      </div>
    </Container>
  );
}
