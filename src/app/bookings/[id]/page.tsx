import { CalendarDays, CreditCard, Video } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingActions } from "@/app/bookings/[id]/booking-actions";
import { ReviewForm } from "@/app/bookings/[id]/review-form";
import { BOOKING_SELECT, type BookingWithPeople } from "@/components/bookings/booking-list";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { ReportForm } from "@/components/report-form";
import { MessageButton } from "@/components/tutors/message-button";
import { ButtonLink } from "@/components/ui/button";
import { Alert, Avatar, Card, CardHeader, Container } from "@/components/ui/primitives";
import { Stars } from "@/components/ui/rating";
import { requireUser } from "@/lib/auth";
import { LESSON_TYPE_LABEL } from "@/lib/constants";
import { getSettings } from "@/lib/data";
import { callWindow, canJoinCall } from "@/lib/lesson-access";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatPrice, formatTime } from "@/lib/utils";
import { uuidSchema } from "@/lib/validation";

export const metadata = { title: "Lesson details" };

export default async function BookingPage({ params, searchParams }: PageProps<"/bookings/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser(`/bookings/${id}`);
  if (!uuidSchema.safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data } = await supabase.from("bookings").select(BOOKING_SELECT).eq("id", id).maybeSingle();
  const booking = data as unknown as BookingWithPeople | null;
  // RLS returns nothing to non-participants (admins can read for moderation).
  if (!booking) notFound();

  const isStudent = booking.student_id === user.id;
  const isTutor = booking.tutor_id === user.id;
  if (!isStudent && !isTutor && user.profile.role !== "admin") notFound();

  const [settings, { data: review }] = await Promise.all([getSettings(), supabase.from("reviews").select("rating, comment, status").eq("booking_id", booking.id).maybeSingle()]);

  const tz = user.profile.timezone;
  // Server Component: rendered per request, so the current time is stable for this render.
  const now = new Date().getTime();
  const startsAt = new Date(booking.starts_at).getTime();
  const endsAt = new Date(booking.ends_at).getTime();
  const active = booking.status === "pending" || booking.status === "confirmed";
  const upcoming = active && startsAt > now;
  const other = isTutor ? booking.student : booking.tutor?.profile;
  const otherId = isTutor ? booking.student_id : booking.tutor_id;

  const studentCancelDeadline = startsAt - settings.studentCancelWindowHours * 3600_000;
  const studentMayCancel = isStudent && upcoming && (booking.status === "pending" || now < studentCancelDeadline);
  const tutorMayCancel = isTutor && upcoming;
  const cancelBlockedReason =
    isStudent && upcoming && booking.status === "confirmed" && now >= studentCancelDeadline
      ? `Confirmed lessons can be cancelled up to ${settings.studentCancelWindowHours} hours before the start. You can still propose a new time or message your tutor.`
      : null;

  const access = canJoinCall(booking, user.id, settings.joinEarlyMinutes);
  const { opensAt } = callWindow(booking, settings.joinEarlyMinutes);

  return (
    <Container className="max-w-4xl py-10">
      <Link href="/bookings" className="text-sm text-primary hover:underline">
        ← All lessons
      </Link>

      {sp.created ? (
        <Alert tone="success" className="mt-4" title="Request sent">
          Your tutor has been notified. You will get a notification when they respond.
        </Alert>
      ) : null}

      <div className="mt-4 grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title={`${booking.language?.name ?? booking.language_code} · ${LESSON_TYPE_LABEL[booking.lesson_type]}`}
              description={`${booking.duration_minutes} minute lesson`}
              action={<BookingStatusBadge status={booking.status} />}
            />
            <div className="space-y-4 px-5 py-5">
              <p className="flex items-center gap-2 text-lg font-medium tabular-nums">
                <CalendarDays className="size-5 text-muted-foreground" aria-hidden="true" />
                {formatDateTime(booking.starts_at, tz, { year: "numeric" })} – {formatTime(booking.ends_at, tz)}
              </p>
              <p className="text-sm text-muted-foreground">Shown in your time zone ({tz.replaceAll("_", " ")}).</p>

              {booking.reschedule_starts_at ? (
                <Alert tone="warning" title={booking.reschedule_requested_by === user.id ? "You proposed a new time" : "A new time was proposed"}>
                  {formatDateTime(booking.reschedule_starts_at, tz, { year: "numeric" })}.{" "}
                  {booking.reschedule_requested_by === user.id ? "Waiting for the other participant." : "Accept it to move the lesson."}
                </Alert>
              ) : null}

              {booking.status === "confirmed" && endsAt + 10 * 60_000 > now ? (
                access.allowed ? (
                  <ButtonLink href={`/lessons/${booking.id}/call`} size="lg">
                    <Video aria-hidden="true" /> Join lesson
                  </ButtonLink>
                ) : (
                  <div className="rounded-xl bg-muted px-4 py-3 text-sm">
                    <p className="flex items-center gap-2 font-medium">
                      <Video className="size-4" aria-hidden="true" /> Video lesson
                    </p>
                    <p className="mt-1 text-muted-foreground">The lesson room opens at {formatDateTime(opensAt.toISOString(), tz)}. Refresh this page then to join.</p>
                  </div>
                )
              ) : null}

              {booking.student_note ? (
                <div>
                  <p className="text-sm font-medium">Note from the student</p>
                  <p className="mt-1 whitespace-pre-line rounded-xl bg-muted px-4 py-3 text-sm">{booking.student_note}</p>
                </div>
              ) : null}
              {booking.cancellation_reason ? (
                <div>
                  <p className="text-sm font-medium">{booking.status === "rejected" ? "Reason for declining" : "Cancellation reason"}</p>
                  <p className="mt-1 rounded-xl bg-muted px-4 py-3 text-sm">{booking.cancellation_reason}</p>
                </div>
              ) : null}

              {isStudent || isTutor ? (
                <BookingActions
                  bookingId={booking.id}
                  tutorId={booking.tutor_id}
                  duration={booking.duration_minutes}
                  timeZone={tz}
                  canRespond={isTutor && booking.status === "pending" && upcoming}
                  canCancel={studentMayCancel || tutorMayCancel}
                  cancelBlockedReason={cancelBlockedReason}
                  canReschedule={upcoming}
                  canComplete={isTutor && booking.status === "confirmed" && endsAt <= now}
                  rescheduleIncoming={Boolean(booking.reschedule_starts_at && booking.reschedule_requested_by !== user.id && upcoming)}
                  rescheduleOutgoing={Boolean(booking.reschedule_starts_at && booking.reschedule_requested_by === user.id && upcoming)}
                />
              ) : null}
            </div>
          </Card>

          {booking.status === "completed" ? (
            <Card>
              <CardHeader title="Review" />
              <div className="px-5 py-5">
                {review ? (
                  <div className="space-y-2">
                    <Stars value={review.rating} />
                    {review.comment ? <p className="whitespace-pre-line text-sm">{review.comment}</p> : null}
                    {review.status === "hidden" ? <p className="text-xs text-muted-foreground">This review was hidden by a moderator.</p> : null}
                  </div>
                ) : isStudent ? (
                  <ReviewForm bookingId={booking.id} />
                ) : (
                  <p className="text-sm text-muted-foreground">The student has not left a review yet.</p>
                )}
              </div>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">{isTutor ? "Student" : "Tutor"}</p>
            <div className="mt-2 flex items-center gap-3">
              <Avatar src={other?.avatar_url} name={other?.full_name} size={48} />
              <p className="font-medium">{other?.full_name ?? "Unknown"}</p>
            </div>
            {isStudent || isTutor ? (
              <div className="mt-4 space-y-2">
                <MessageButton userId={otherId} returnTo={`/bookings/${booking.id}`} label="Send a message" />
                {isStudent ? (
                  <ButtonLink href={`/tutors/${booking.tutor_id}`} variant="ghost" className="w-full">
                    View tutor profile
                  </ButtonLink>
                ) : null}
              </div>
            ) : null}
          </Card>
          <Card className="p-5 text-sm">
            <p className="flex items-center justify-between">
              <span className="text-muted-foreground">Price</span>
              <span className="font-semibold">{formatPrice(booking.price_cents, booking.currency)}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatPrice(booking.hourly_rate_cents, booking.currency)}/hour × {booking.duration_minutes} min, fixed when booked.
            </p>
            <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
              <CreditCard className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> Payment status: not collected. Online payments are not available yet.
            </p>
          </Card>
          {isStudent || isTutor ? <ReportForm reportedUserId={otherId} label={`Report ${isTutor ? "student" : "tutor"}`} /> : null}
        </aside>
      </div>
    </Container>
  );
}
