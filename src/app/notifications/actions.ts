"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireUser("/notifications");
  const id = uuidSchema.safeParse(formData.get("id"));
  const supabase = await createClient();
  let q = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
  if (id.success) q = q.eq("id", id.data);
  await q;
  revalidatePath("/", "layout");
}

export async function deleteNotificationAction(formData: FormData) {
  const user = await requireUser("/notifications");
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("notifications").delete().eq("id", id.data).eq("user_id", user.id);
  revalidatePath("/notifications");
}
