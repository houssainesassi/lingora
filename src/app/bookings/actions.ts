"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSessionUser, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState, LessonType } from "@/lib/types";
import { friendlyDbError } from "@/lib/utils";
import { uuidSchema } from "@/lib/validation";

const requestSchema = z.object({
  tutorId: uuidSchema,
  language: z.string().min(2).max(10),
  lessonType: z.enum(["trial", "conversation", "structured", "exam_prep", "business"]),
  duration: z.coerce.number().refine((n) => [25, 50, 60].includes(n), "Choose a lesson length"),
  startsAt: z.iso.datetime({ offset: true, message: "Choose a time" }),
  note: z.string().trim().max(1000).optional(),
});

export async function requestBookingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  const tutorId = String(formData.get("tutorId") ?? "");
  if (!user) redirect(`/login?next=${encodeURIComponent(`/tutors/${tutorId}#book`)}`);
  if (!user.profile.onboarded) redirect("/onboarding");

  const parsed = requestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Please complete the booking form." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_booking", {
    p_tutor_id: parsed.data.tutorId,
    p_language_code: parsed.data.language,
    p_lesson_type: parsed.data.lessonType as LessonType,
    p_duration: parsed.data.duration,
    p_starts_at: parsed.data.startsAt,
    p_note: parsed.data.note ?? undefined,
  });
  if (error || !data) return { ok: false, message: friendlyDbError(error, "We could not create the booking. Please try again.") };

  revalidatePath("/bookings");
  redirect(`/bookings/${data}?created=1`);
}

async function runBookingRpc(bookingId: string, fn: (supabase: Awaited<ReturnType<typeof createClient>>) => PromiseLike<{ error: { message: string; code: string } | null }>, successMessage: string): Promise<ActionState> {
  await requireUser(`/bookings/${bookingId}`);
  if (!uuidSchema.safeParse(bookingId).success) return { ok: false, message: "Unknown booking." };
  const supabase = await createClient();
  const { error } = await fn(supabase);
  if (error) return { ok: false, message: friendlyDbError(error) };
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: successMessage };
}

export async function respondBookingAction(bookingId: string, accept: boolean, reason?: string): Promise<ActionState> {
  return runBookingRpc(
    bookingId,
    (s) => s.rpc("respond_booking", { p_booking_id: bookingId, p_accept: accept, p_reason: reason?.slice(0, 500) }),
    accept ? "Lesson confirmed." : "Request declined.",
  );
}

export async function cancelBookingAction(bookingId: string, reason?: string): Promise<ActionState> {
  return runBookingRpc(bookingId, (s) => s.rpc("cancel_booking", { p_booking_id: bookingId, p_reason: reason?.slice(0, 500) }), "Lesson cancelled.");
}

export async function requestRescheduleAction(bookingId: string, newStartsAt: string): Promise<ActionState> {
  if (!z.iso.datetime({ offset: true }).safeParse(newStartsAt).success) return { ok: false, message: "Choose a new time." };
  return runBookingRpc(bookingId, (s) => s.rpc("request_reschedule", { p_booking_id: bookingId, p_new_starts_at: newStartsAt }), "New time proposed. The other participant needs to accept it.");
}

export async function respondRescheduleAction(bookingId: string, accept: boolean): Promise<ActionState> {
  return runBookingRpc(bookingId, (s) => s.rpc("respond_reschedule", { p_booking_id: bookingId, p_accept: accept }), accept ? "Lesson moved to the new time." : "Reschedule request closed.");
}

export async function completeBookingAction(bookingId: string): Promise<ActionState> {
  return runBookingRpc(bookingId, (s) => s.rpc("complete_booking", { p_booking_id: bookingId }), "Lesson marked as completed.");
}

const reviewSchema = z.object({
  bookingId: uuidSchema,
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  comment: z.string().trim().max(2000).optional(),
});

export async function submitReviewAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/bookings");
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Choose a rating." };

  const supabase = await createClient();
  const { data: booking } = await supabase.from("bookings").select("id, tutor_id, student_id, status").eq("id", parsed.data.bookingId).maybeSingle();
  if (!booking || booking.student_id !== user.id || booking.status !== "completed") {
    return { ok: false, message: "You can review a lesson after it has been completed." };
  }
  // RLS + the unique booking_id constraint enforce the same rules in the database.
  const { error } = await supabase.from("reviews").insert({
    booking_id: booking.id,
    tutor_id: booking.tutor_id,
    student_id: user.id,
    rating: parsed.data.rating,
    comment: parsed.data.comment || null,
  });
  if (error) return { ok: false, message: error.code === "23505" ? "You already reviewed this lesson." : friendlyDbError(error) };

  revalidatePath(`/bookings/${booking.id}`);
  revalidatePath(`/tutors/${booking.tutor_id}`);
  return { ok: true, message: "Thanks for your review." };
}
