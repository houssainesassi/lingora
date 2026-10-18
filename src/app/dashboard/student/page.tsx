import { BookOpen, CalendarCheck, Clock, Heart, Target } from "lucide-react";
import Link from "next/link";

import { LearningGoalsForm, StudentLanguageForm } from "@/app/dashboard/student/student-forms";
import { removeStudentLanguageAction } from "@/app/settings/actions";
import { BOOKING_SELECT, BookingList, type BookingWithPeople } from "@/components/bookings/booking-list";
import { RecentConversations } from "@/components/dashboard/recent-conversations";
import { ButtonLink } from "@/components/ui/button";
import { Avatar, Badge, Card, CardHeader, Container, EmptyState, PageHeader, StatCard } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import { CEFR_DESCRIPTIONS } from "@/lib/constants";
import { getLanguages } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatRelative } from "@/lib/utils";

export const metadata = { title: "Student dashboard" };

export default async function StudentDashboard() {
  const user = await requireUser("/dashboard/student");
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [upcoming, past, { data: studentLangs }, { data: favorites }, { data: conversations }, { data: notifications }, languages] = await Promise.all([
    supabase.from("bookings").select(BOOKING_SELECT).eq("student_id", user.id).in("status", ["pending", "confirmed"]).gte("ends_at", now).order("starts_at").limit(10),
    supabase.from("bookings").select(BOOKING_SELECT).eq("student_id", user.id).eq("status", "completed").order("starts_at", { ascending: false }).limit(5),
    supabase.from("student_languages").select("language_code, current_level, target_level, goal, language:languages(name)").eq("student_id", user.id).order("created_at"),
    supabase.from("favorites").select("tutor_id, tutor:tutor_profiles(id, headline, hourly_rate_cents, currency, status, profile:profiles!tutor_profiles_id_fkey(full_name, avatar_url))").eq("student_id", user.id).order("created_at", { ascending: false }).limit(6),
    supabase.rpc("get_my_conversations", { p_limit: 5 }),
    supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    getLanguages(),
  ]);

  const { data: completedAll } = await supabase.from("bookings").select("duration_minutes").eq("student_id", user.id).eq("status", "completed");
  const completedCount = (completedAll ?? []).length;
  const hours = (completedAll ?? []).reduce((s, b) => s + b.duration_minutes, 0) / 60;
  const visibleFavorites = (favorites ?? []).filter((f) => f.tutor && f.tutor.status === "approved");

  return (
    <Container className="py-10">
      <PageHeader
        title={`Hi ${user.profile.full_name.split(" ")[0] || "there"}`}
        description="Your learning at a glance."
        action={<ButtonLink href="/tutors">Find a tutor</ButtonLink>}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Completed lessons" value={completedCount} icon={<CalendarCheck />} />
        <StatCard label="Learning hours" value={hours.toFixed(1)} icon={<Clock />} />
        <StatCard label="Languages" value={(studentLangs ?? []).length} icon={<BookOpen />} />
        <StatCard label="Favorite tutors" value={visibleFavorites.length} icon={<Heart />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <section>
            <h2 className="mb-3 font-semibold">Upcoming lessons</h2>
            <BookingList
              bookings={(upcoming.data ?? []) as unknown as BookingWithPeople[]}
              viewerId={user.id}
              timeZone={user.profile.timezone}
              emptyTitle="No upcoming lessons"
              emptyDescription="Book a lesson with a tutor to start practising."
            />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Past lessons</h2>
              <Link href="/bookings?tab=past" className="text-sm text-primary hover:underline">
                See all
              </Link>
            </div>
            <BookingList bookings={(past.data ?? []) as unknown as BookingWithPeople[]} viewerId={user.id} timeZone={user.profile.timezone} emptyTitle="No completed lessons yet" />
          </section>

          <Card>
            <CardHeader title="Languages I’m learning" description="Your current and target CEFR levels." />
            <div className="space-y-4 p-5">
              {(studentLangs ?? []).length > 0 ? (
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {(studentLangs ?? []).map((l) => (
                    <li key={l.language_code} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
                      <span className="font-medium">{l.language?.name}</span>
                      <Badge tone="primary" title={CEFR_DESCRIPTIONS[l.current_level]}>
                        Now {l.current_level}
                      </Badge>
                      {l.target_level ? <Badge tone="success">Goal {l.target_level}</Badge> : null}
                      {l.goal ? <span className="w-full text-muted-foreground sm:w-auto">{l.goal}</span> : null}
                      <div className="ml-auto flex gap-3">
                        <Link href={`/tutors?teaches=${l.language_code}`} className="text-primary hover:underline">
                          Find tutors
                        </Link>
                        <form action={removeStudentLanguageAction}>
                          <input type="hidden" name="language" value={l.language_code} />
                          <button type="submit" className="text-danger hover:underline">
                            Remove
                          </button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Add the languages you are learning.</p>
              )}
              <StudentLanguageForm languages={languages.map((l) => ({ code: l.code, name: l.name }))} />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Learning goals" action={<Target className="size-4 text-muted-foreground" aria-hidden="true" />} />
            <div className="p-5">
              <LearningGoalsForm defaultValue={user.profile.learning_goals ?? ""} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Favorite tutors" />
            {visibleFavorites.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={<Heart />} title="No favorites yet" description="Tap the heart on a tutor to save them here." />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {visibleFavorites.map((f) => (
                  <li key={f.tutor_id}>
                    <Link href={`/tutors/${f.tutor_id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/60">
                      <Avatar src={f.tutor?.profile?.avatar_url} name={f.tutor?.profile?.full_name} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{f.tutor?.profile?.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{f.tutor?.headline}</p>
                      </div>
                      <span className="text-sm font-medium">{formatPrice(f.tutor!.hourly_rate_cents, f.tutor!.currency)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <RecentConversations conversations={conversations ?? []} />

          <Card>
            <CardHeader
              title="Notifications"
              action={
                <Link href="/notifications" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              }
            />
            {(notifications ?? []).length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">You’re all caught up.</p>
            ) : (
              <ul className="divide-y divide-border">
                {(notifications ?? []).map((n) => (
                  <li key={n.id} className="px-5 py-3 text-sm">
                    <Link href={n.link ?? "/notifications"} className="hover:underline">
                      <span className={n.read_at ? "" : "font-semibold"}>{n.title}</span>
                    </Link>
                    <p className="text-xs text-muted-foreground">{formatRelative(n.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <ButtonLink href="/settings" variant="secondary" className="w-full">
            Account settings
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
