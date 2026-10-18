import { notFound } from "next/navigation";

import { CallRoom } from "@/app/lessons/[id]/call/call-room";
import { ButtonLink } from "@/components/ui/button";
import { Alert, Container } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import { LESSON_TYPE_LABEL } from "@/lib/constants";
import { getSettings } from "@/lib/data";
import { callWindow, canJoinCall } from "@/lib/lesson-access";
import { liveKitConfig } from "@/lib/livekit";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";

export const metadata = { title: "Lesson room" };

export default async function CallPage({ params }: PageProps<"/lessons/[id]/call">) {
  const { id } = await params;
  const user = await requireUser(`/lessons/${id}/call`);
  if (!uuidSchema.safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: booking } = await supabase.from("bookings").select("id, status, starts_at, ends_at, student_id, tutor_id, lesson_type, duration_minutes").eq("id", id).maybeSingle();
  if (!booking || (booking.student_id !== user.id && booking.tutor_id !== user.id)) notFound();

  const settings = await getSettings();
  const access = canJoinCall(booking, user.id, settings.joinEarlyMinutes);
  const lk = liveKitConfig();

  if (!lk.configured || !access.allowed) {
    return (
      <Container className="max-w-xl py-16">
        <Alert tone="warning" title={!lk.configured ? "Video calls are not configured" : "You cannot join this lesson right now"}>
          {!lk.configured
            ? "The server is missing LIVEKIT_URL, LIVEKIT_API_KEY and/or LIVEKIT_API_SECRET. Add them to the environment (see README) and redeploy to enable voice and video lessons."
            : !access.allowed
              ? access.reason
              : null}
        </Alert>
        <ButtonLink href={`/bookings/${booking.id}`} variant="secondary" className="mt-6">
          Back to lesson details
        </ButtonLink>
      </Container>
    );
  }

  return (
    <CallRoom
      bookingId={booking.id}
      title={`${LESSON_TYPE_LABEL[booking.lesson_type]} · ${booking.duration_minutes} min`}
      startsAt={booking.starts_at}
      endsAt={booking.ends_at}
      closesAt={callWindow(booking, settings.joinEarlyMinutes).closesAt.toISOString()}
    />
  );
}
