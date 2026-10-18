import type { Booking } from "@/lib/types";

export const CALL_GRACE_MINUTES_AFTER_END = 10;

/** When participants may join the video call for a booking. Shared by UI and token endpoint. */
export function callWindow(booking: Pick<Booking, "starts_at" | "ends_at">, joinEarlyMinutes: number) {
  const opensAt = new Date(new Date(booking.starts_at).getTime() - joinEarlyMinutes * 60_000);
  const closesAt = new Date(new Date(booking.ends_at).getTime() + CALL_GRACE_MINUTES_AFTER_END * 60_000);
  return { opensAt, closesAt };
}

export type CallAccess = { allowed: true } | { allowed: false; reason: string };

export function canJoinCall(booking: Pick<Booking, "status" | "starts_at" | "ends_at" | "student_id" | "tutor_id">, userId: string, joinEarlyMinutes: number, now = new Date()): CallAccess {
  if (booking.student_id !== userId && booking.tutor_id !== userId) return { allowed: false, reason: "You are not a participant in this lesson." };
  if (booking.status !== "confirmed") return { allowed: false, reason: "Only confirmed lessons can be joined." };
  const { opensAt, closesAt } = callWindow(booking, joinEarlyMinutes);
  if (now < opensAt) return { allowed: false, reason: `The lesson room opens ${joinEarlyMinutes} minutes before the start time.` };
  if (now > closesAt) return { allowed: false, reason: "This lesson has ended." };
  return { allowed: true };
}
