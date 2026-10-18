"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";
import { friendlyDbError } from "@/lib/utils";
import { uuidSchema } from "@/lib/validation";

// Every action re-checks the admin role on the server. RLS policies and the
// guard triggers enforce the same rule in the database.
async function admin() {
  const user = await requireRole("admin", "/admin");
  return { user, supabase: await createClient() };
}

export async function reviewTutorAction(formData: FormData) {
  const { supabase } = await admin();
  const id = uuidSchema.safeParse(formData.get("tutorId"));
  const decision = z.enum(["approved", "rejected", "suspended", "pending"]).safeParse(formData.get("decision"));
  if (!id.success || !decision.success) return;
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000) || null;
  await supabase
    .from("tutor_profiles")
    .update({ status: decision.data, rejection_reason: decision.data === "approved" ? null : reason })
    .eq("id", id.data);
  revalidatePath("/admin", "layout");
  revalidatePath("/tutors");
}

export async function setUserSuspendedAction(formData: FormData) {
  const { user, supabase } = await admin();
  const id = uuidSchema.safeParse(formData.get("userId"));
  if (!id.success || id.data === user.id) return;
  await supabase.from("profiles").update({ is_suspended: formData.get("suspended") === "true" }).eq("id", id.data);
  revalidatePath("/admin/users");
}

export async function setUserRoleAction(formData: FormData) {
  const { user, supabase } = await admin();
  const id = uuidSchema.safeParse(formData.get("userId"));
  const role = z.enum(["student", "tutor", "admin"]).safeParse(formData.get("role"));
  if (!id.success || !role.success || id.data === user.id) return;
  await supabase.from("profiles").update({ role: role.data }).eq("id", id.data);
  revalidatePath("/admin/users");
}

export async function updateReportAction(formData: FormData) {
  const { user, supabase } = await admin();
  const id = uuidSchema.safeParse(formData.get("reportId"));
  const status = z.enum(["open", "reviewing", "resolved", "dismissed"]).safeParse(formData.get("status"));
  if (!id.success || !status.success) return;
  const closed = status.data === "resolved" || status.data === "dismissed";
  await supabase
    .from("reports")
    .update({
      status: status.data,
      admin_note: String(formData.get("note") ?? "").trim().slice(0, 2000) || null,
      resolved_by: closed ? user.id : null,
      resolved_at: closed ? new Date().toISOString() : null,
    })
    .eq("id", id.data);
  revalidatePath("/admin/reports");
}

export async function moderateReviewAction(formData: FormData) {
  const { supabase } = await admin();
  const id = uuidSchema.safeParse(formData.get("reviewId"));
  const status = z.enum(["published", "hidden"]).safeParse(formData.get("status"));
  if (!id.success || !status.success) return;
  await supabase.from("reviews").update({ status: status.data }).eq("id", id.data);
  revalidatePath("/admin/reviews");
}

const languageSchema = z.object({
  code: z.string().trim().toLowerCase().regex(/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/, "Use an ISO code such as nl or pt-br"),
  name: z.string().trim().min(1).max(60),
  nativeName: z.string().trim().max(60).optional(),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(100),
});

export async function addLanguageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await admin();
  const parsed = languageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the language details." };
  const { error } = await supabase.from("languages").insert({ code: parsed.data.code, name: parsed.data.name, native_name: parsed.data.nativeName || null, sort_order: parsed.data.sortOrder });
  if (error) return { ok: false, message: error.code === "23505" ? "A language with this code already exists." : friendlyDbError(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: `${parsed.data.name} added.` };
}

export async function toggleLanguageAction(formData: FormData) {
  const { supabase } = await admin();
  const code = String(formData.get("code") ?? "");
  await supabase.from("languages").update({ is_active: formData.get("active") === "true" }).eq("code", code);
  revalidatePath("/", "layout");
}

export async function getTutorDocumentUrlAction(tutorId: string, name: string): Promise<string | null> {
  const { supabase } = await admin();
  if (!uuidSchema.safeParse(tutorId).success || !/^[\w.-]{1,120}$/.test(name)) return null;
  const { data } = await supabase.storage.from("tutor-documents").createSignedUrl(`${tutorId}/${name}`, 300);
  return data?.signedUrl ?? null;
}
