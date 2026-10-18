"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState, CefrLevel } from "@/lib/types";
import { friendlyDbError, isValidTimeZone } from "@/lib/utils";
import { cefr, fieldErrors, formToObject, learningSchema, profileSchema } from "@/lib/validation";

const onboardingSchema = profileSchema.extend({
  role: z.enum(["student", "tutor"]),
  learnLanguage: z.string().max(10).optional(),
  learnLevel: cefr.optional(),
  learningGoals: z.string().trim().max(2000).optional(),
});

export async function completeOnboardingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/onboarding", { allowIncomplete: true });
  const parsed = onboardingSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  if (!isValidTimeZone(d.timezone)) return { ok: false, fieldErrors: { timezone: ["Choose a valid time zone"] }, message: "Choose a valid time zone." };

  const supabase = await createClient();
  // Admins keep their role; everyone else picks student or tutor.
  const role = user.profile.role === "admin" ? "admin" : d.role;
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: d.fullName, country: d.country ?? null, timezone: d.timezone, role, learning_goals: d.learningGoals || null, onboarded: true })
    .eq("id", user.id);
  if (error) return { ok: false, message: friendlyDbError(error) };

  if (role === "student" && d.learnLanguage) {
    const { error: langError } = await supabase
      .from("student_languages")
      .upsert({ student_id: user.id, language_code: d.learnLanguage, current_level: (d.learnLevel ?? "A1") as CefrLevel });
    if (langError) return { ok: false, message: friendlyDbError(langError) };
  }

  revalidatePath("/", "layout");
  redirect(role === "tutor" ? "/dashboard/tutor/profile?welcome=1" : role === "admin" ? "/admin" : "/dashboard/student");
}

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/settings");
  const parsed = profileSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (!isValidTimeZone(parsed.data.timezone)) return { ok: false, fieldErrors: { timezone: ["Choose a valid time zone"] } };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, country: parsed.data.country ?? null, timezone: parsed.data.timezone, bio: parsed.data.bio || null })
    .eq("id", user.id);
  if (error) return { ok: false, message: friendlyDbError(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: "Profile saved." };
}

export async function updateLearningGoalsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/settings");
  const parsed = learningSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, message: "Your goals are too long." };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ learning_goals: parsed.data.learningGoals || null }).eq("id", user.id);
  if (error) return { ok: false, message: friendlyDbError(error) };
  revalidatePath("/dashboard/student");
  return { ok: true, message: "Learning goals saved." };
}

const studentLanguageSchema = z.object({
  language: z.string().min(2).max(10),
  currentLevel: cefr,
  targetLevel: cefr.optional().or(z.literal("").transform(() => undefined)),
  goal: z.string().trim().max(500).optional(),
});

export async function saveStudentLanguageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/settings");
  const parsed = studentLanguageSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, message: "Choose a language and your current level.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.from("student_languages").upsert({
    student_id: user.id,
    language_code: parsed.data.language,
    current_level: parsed.data.currentLevel as CefrLevel,
    target_level: (parsed.data.targetLevel ?? null) as CefrLevel | null,
    goal: parsed.data.goal || null,
  });
  if (error) return { ok: false, message: friendlyDbError(error) };
  revalidatePath("/settings");
  revalidatePath("/dashboard/student");
  return { ok: true, message: "Language saved." };
}

export async function removeStudentLanguageAction(formData: FormData) {
  const user = await requireUser("/settings");
  const code = String(formData.get("language") ?? "");
  const supabase = await createClient();
  await supabase.from("student_languages").delete().eq("student_id", user.id).eq("language_code", code);
  revalidatePath("/settings");
  revalidatePath("/dashboard/student");
}

/**
 * The browser uploads the file straight to Supabase Storage (RLS restricts it
 * to the user's own folder); this action only stores the resulting URL.
 */
export async function setAvatarAction(path: string | null): Promise<ActionState> {
  const user = await requireUser("/settings");
  const supabase = await createClient();
  let url: string | null = null;
  if (path) {
    if (!/^[0-9a-f-]{36}\/[\w.-]{1,100}$/.test(path) || !path.startsWith(`${user.id}/`)) {
      return { ok: false, message: "Invalid upload path." };
    }
    url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }
  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
  if (error) return { ok: false, message: friendlyDbError(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: url ? "Photo updated." : "Photo removed." };
}

export async function switchRoleAction(formData: FormData) {
  const user = await requireUser("/settings");
  const role = formData.get("role");
  if (user.profile.role === "admin" || (role !== "student" && role !== "tutor")) return;
  const supabase = await createClient();
  await supabase.from("profiles").update({ role }).eq("id", user.id);
  revalidatePath("/", "layout");
  redirect(role === "tutor" ? "/dashboard/tutor/profile" : "/dashboard/student");
}
