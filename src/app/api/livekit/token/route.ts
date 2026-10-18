import { NextResponse, type NextRequest } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { callWindow, canJoinCall } from "@/lib/lesson-access";
import { createLessonToken, liveKitConfig } from "@/lib/livekit";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";

const noStore = { "Cache-Control": "no-store" };

/**
 * Issues a short-lived LiveKit token after verifying, on the server:
 * the user's session, that they are a participant, that the booking is
 * confirmed, and that the current time is inside the lesson window.
 */
export async function POST(request: NextRequest) {
  const cfg = liveKitConfig();
  if (!cfg.configured) {
    return NextResponse.json({ error: "Video calls are not configured on this server (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)." }, { status: 503, headers: noStore });
  }

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401, headers: noStore });
  if (user.profile.is_suspended) return NextResponse.json({ error: "Account suspended." }, { status: 403, headers: noStore });

  const body = (await request.json().catch(() => null)) as { bookingId?: unknown } | null;
  const parsed = uuidSchema.safeParse(body?.bookingId);
  if (!parsed.success) return NextResponse.json({ error: "Invalid lesson." }, { status: 400, headers: noStore });

  const supabase = await createClient();
  const { data: booking } = await supabase.from("bookings").select("id, status, starts_at, ends_at, student_id, tutor_id").eq("id", parsed.data).maybeSingle();
  if (!booking) return NextResponse.json({ error: "Lesson not found." }, { status: 404, headers: noStore });

  const settings = await getSettings();
  const access = canJoinCall(booking, user.id, settings.joinEarlyMinutes);
  if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 403, headers: noStore });

  const token = await createLessonToken({
    bookingId: booking.id,
    userId: user.id,
    name: user.profile.full_name,
    expiresAt: callWindow(booking, settings.joinEarlyMinutes).closesAt,
  });
  return NextResponse.json({ token, url: cfg.url }, { headers: noStore });
}
