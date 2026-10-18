"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { friendlyDbError } from "@/lib/utils";
import { uuidSchema } from "@/lib/validation";

export type FavoriteResult = { ok: true; favorited: boolean } | { ok: false; message: string; needsLogin?: boolean };

export async function toggleFavoriteAction(tutorId: string, favorite: boolean): Promise<FavoriteResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, needsLogin: true, message: "Log in to save favorite tutors." };
  if (!uuidSchema.safeParse(tutorId).success) return { ok: false, message: "Unknown tutor." };

  const supabase = await createClient();
  const { error } = favorite
    ? await supabase.from("favorites").upsert({ student_id: user.id, tutor_id: tutorId }, { ignoreDuplicates: true })
    : await supabase.from("favorites").delete().eq("student_id", user.id).eq("tutor_id", tutorId);

  if (error) return { ok: false, message: friendlyDbError(error, "Could not update favorites.") };
  revalidatePath("/dashboard/student");
  return { ok: true, favorited: favorite };
}

/** Opens (or creates) the one-to-one conversation with another user. */
export async function startConversationAction(formData: FormData) {
  const otherUserId = String(formData.get("userId") ?? "");
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(String(formData.get("returnTo") ?? "/tutors"))}`);
  if (!uuidSchema.safeParse(otherUserId).success) redirect("/messages?error=unknown");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_conversation", { p_other_user: otherUserId });
  if (error || !data) redirect(`/messages?error=${encodeURIComponent(friendlyDbError(error, "Could not start the conversation."))}`);
  redirect(`/messages/${data}`);
}
