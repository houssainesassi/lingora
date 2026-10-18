"use server";

import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { REPORT_REASONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";
import { friendlyDbError } from "@/lib/utils";
import { uuidSchema } from "@/lib/validation";

const schema = z
  .object({
    reportedUserId: uuidSchema.optional().or(z.literal("").transform(() => undefined)),
    reviewId: uuidSchema.optional().or(z.literal("").transform(() => undefined)),
    reason: z.enum(REPORT_REASONS.map((r) => r.value) as [string, ...string[]]),
    details: z.string().trim().max(2000).optional(),
  })
  .refine((d) => d.reportedUserId || d.reviewId, "Nothing to report");

export async function submitReportAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Choose a reason for your report." };
  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_user_id: parsed.data.reportedUserId ?? null,
    review_id: parsed.data.reviewId ?? null,
    reason: parsed.data.reason,
    details: parsed.data.details || null,
  });
  if (error) return { ok: false, message: friendlyDbError(error) };
  return { ok: true, message: "Thanks. Our team will review your report." };
}
