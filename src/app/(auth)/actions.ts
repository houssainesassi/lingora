"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { siteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";
import { isValidTimeZone, safeNextPath } from "@/lib/utils";
import { emailSchema, fieldErrors, formToObject, passwordSchema, signInSchema, signUpSchema } from "@/lib/validation";

async function origin() {
  const h = await headers();
  return h.get("origin") ?? siteUrl();
}

export async function signUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };

  const { email, password, fullName, role } = parsed.data;
  const timezone = parsed.data.timezone && isValidTimeZone(parsed.data.timezone) ? parsed.data.timezone : "UTC";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // The database trigger reads these. "admin" is never accepted from here.
      data: { full_name: fullName, role, timezone },
      emailRedirectTo: `${await origin()}/auth/confirm?next=/onboarding`,
    },
  });

  if (error) {
    return { ok: false, message: error.code === "weak_password" ? error.message : "We could not create your account. " + error.message };
  }
  // With email confirmation disabled Supabase returns a session right away.
  if (data.session) redirect("/onboarding");
  return { ok: true, message: `We sent a confirmation link to ${email}. Open it to activate your account.` };
}

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") return { ok: false, message: "Please confirm your email address first. Check your inbox." };
    return { ok: false, message: "Incorrect email or password." };
  }
  redirect(safeNextPath(formData.get("next")?.toString()));
}

export async function forgotPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, fieldErrors: { email: ["Enter a valid email address"] }, message: "Enter a valid email address." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${await origin()}/auth/confirm?next=/reset-password`,
  });
  // Same response whether or not the account exists (no account enumeration).
  return { ok: true, message: "If an account exists for that email, a reset link is on its way." };
}

export async function updatePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) return { ok: false, fieldErrors: { password: password.error.issues.map((i) => i.message) }, message: "Choose a stronger password." };
  if (formData.get("confirm") !== password.data) return { ok: false, fieldErrors: { confirm: ["Passwords do not match"] }, message: "Passwords do not match." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return { ok: false, message: "Your reset link has expired. Request a new one." };

  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Your password was updated." };
}
