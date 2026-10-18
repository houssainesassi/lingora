"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState, CefrLevel } from "@/lib/types";
import { friendlyDbError } from "@/lib/utils";
import { cefr, fieldErrors, formToObject, tutorProfileSchema, uuidSchema } from "@/lib/validation";

function revalidateTutor(id: string) {
  revalidatePath("/dashboard/tutor", "layout");
  revalidatePath(`/tutors/${id}`);
  revalidatePath("/tutors");
}

export async function saveTutorProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("tutor", "/dashboard/tutor/profile");
  const parsed = tutorProfileSchema.safeParse(formToObject(formData, ["durations", "specialties", "levels"]));
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("tutor_profiles")
    .update({
      headline: d.headline,
      about: d.about,
      teaching_experience_years: d.experience,
      certifications: d.certifications || null,
      hourly_rate_cents: Math.round(d.hourlyRate * 100),
      lesson_durations: [...new Set(d.durations)].sort((a, b) => a - b),
      specialties: [...new Set(d.specialties)],
      levels_taught: [...new Set(d.levels)] as CefrLevel[],
    })
    .eq("id", user.id);
  if (error) return { ok: false, message: friendlyDbError(error) };
  revalidateTutor(user.id);
  return { ok: true, message: "Tutor profile saved." };
}

export async function submitForReviewAction(): Promise<ActionState> {
  const user = await requireRole("tutor", "/dashboard/tutor/profile");
  const supabase = await createClient();
  // The database trigger validates completeness and only allows draft/rejected -> pending.
  const { error } = await supabase.from("tutor_profiles").update({ status: "pending" }).eq("id", user.id);
  if (error) return { ok: false, message: friendlyDbError(error) };
  revalidateTutor(user.id);
  return { ok: true, message: "Submitted for review. We will notify you when an administrator has decided." };
}

const languageSchema = z
  .object({
    language: z.string().min(2).max(10),
    teaches: z.enum(["on"]).optional(),
    isNative: z.enum(["on"]).optional(),
    proficiency: cefr.optional().or(z.literal("").transform(() => undefined)),
  })
  .refine((d) => d.isNative || d.proficiency, { message: "Select your level, or mark the language as native", path: ["proficiency"] })
  .refine((d) => d.teaches || d.isNative || d.proficiency, { message: "Nothing to save", path: ["language"] });

export async function saveTutorLanguageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("tutor", "/dashboard/tutor/profile");
  const parsed = languageSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the language details.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.from("tutor_languages").upsert({
    tutor_id: user.id,
    language_code: parsed.data.language,
    teaches: Boolean(parsed.data.teaches),
    is_native: Boolean(parsed.data.isNative),
    proficiency: (parsed.data.proficiency ?? null) as CefrLevel | null,
  });
  if (error) return { ok: false, message: friendlyDbError(error) };
  revalidateTutor(user.id);
  return { ok: true, message: "Language saved." };
}

export async function removeTutorLanguageAction(formData: FormData) {
  const user = await requireRole("tutor", "/dashboard/tutor/profile");
  const supabase = await createClient();
  await supabase.from("tutor_languages").delete().eq("tutor_id", user.id).eq("language_code", String(formData.get("language") ?? ""));
  revalidateTutor(user.id);
}

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$|^24:00$/;
const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const availabilitySchema = z
  .object({
    weekdays: z.array(z.coerce.number().int().min(0).max(6)).min(1, "Choose at least one day"),
    start: z.string().regex(timeRegex, "Use HH:MM"),
    end: z.string().regex(timeRegex, "Use HH:MM"),
  })
  .refine((d) => toMinutes(d.end) - toMinutes(d.start) >= 25, { message: "Windows must be at least 25 minutes long", path: ["end"] });

export async function addAvailabilityAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("tutor", "/dashboard/tutor/availability");
  const parsed = availabilitySchema.safeParse(formToObject(formData, ["weekdays"]));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the times.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const rows = [...new Set(parsed.data.weekdays)].map((weekday) => ({ tutor_id: user.id, weekday, start_minute: toMinutes(parsed.data.start), end_minute: toMinutes(parsed.data.end) }));
  const { error } = await supabase.from("tutor_availability").insert(rows);
  if (error) return { ok: false, message: error.code === "23P01" ? "This window overlaps an existing one on one of the selected days." : friendlyDbError(error) };
  revalidateTutor(user.id);
  return { ok: true, message: "Availability added." };
}

export async function removeAvailabilityAction(formData: FormData) {
  const user = await requireRole("tutor", "/dashboard/tutor/availability");
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("tutor_availability").delete().eq("id", id.data).eq("tutor_id", user.id);
  revalidateTutor(user.id);
}

const timeOffSchema = z
  .object({ startsAt: z.iso.datetime({ offset: true }), endsAt: z.iso.datetime({ offset: true }), note: z.string().trim().max(200).optional() })
  .refine((d) => new Date(d.endsAt) > new Date(d.startsAt), { message: "The end must be after the start", path: ["endsAt"] });

export async function addTimeOffAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("tutor", "/dashboard/tutor/availability");
  const parsed = timeOffSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the dates." };
  const supabase = await createClient();
  const { error } = await supabase.from("tutor_time_off").insert({ tutor_id: user.id, starts_at: parsed.data.startsAt, ends_at: parsed.data.endsAt, note: parsed.data.note || null });
  if (error) return { ok: false, message: friendlyDbError(error) };
  revalidateTutor(user.id);
  return { ok: true, message: "Time off added. Existing lessons are not affected; cancel or reschedule them if needed." };
}

export async function removeTimeOffAction(formData: FormData) {
  const user = await requireRole("tutor", "/dashboard/tutor/availability");
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("tutor_time_off").delete().eq("id", id.data).eq("tutor_id", user.id);
  revalidateTutor(user.id);
}

export async function removeTutorDocumentAction(formData: FormData) {
  const user = await requireRole("tutor", "/dashboard/tutor/profile");
  const name = String(formData.get("name") ?? "");
  if (!/^[\w.-]{1,120}$/.test(name)) return;
  const supabase = await createClient();
  await supabase.storage.from("tutor-documents").remove([`${user.id}/${name}`]);
  revalidatePath("/dashboard/tutor/profile");
}
