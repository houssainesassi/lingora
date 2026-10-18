import type { Database } from "@/lib/supabase/database.types";

type PublicSchema = Database["public"];

export type Row<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type Enum<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];

export type Profile = Row<"profiles">;
export type TutorProfile = Row<"tutor_profiles">;
export type Language = Row<"languages">;
export type Booking = Row<"bookings">;
export type Message = Row<"messages">;
export type Notification = Row<"notifications">;

export type UserRole = Enum<"user_role">;
export type CefrLevel = Enum<"cefr_level">;
export type BookingStatus = Enum<"booking_status">;
export type LessonType = Enum<"lesson_type">;
export type TutorStatus = Enum<"tutor_status">;

export type TutorSearchRow = PublicSchema["Functions"]["search_tutors"]["Returns"][number];

export interface TutorLanguageInfo {
  code: string;
  name: string;
  teaches: boolean;
  is_native: boolean;
  proficiency: CefrLevel | null;
}

/** Result shape of server actions used with useActionState. */
export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
} | null;
