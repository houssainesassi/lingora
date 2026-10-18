import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

export interface SessionUser {
  id: string;
  email: string | null;
  profile: Profile;
}

/**
 * Returns the signed-in user and profile, verified against Supabase Auth
 * (getClaims validates the JWT signature). Memoised per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (error || !sub) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", sub).maybeSingle();
  if (!profile) return null;
  return { id: sub, email: (data.claims.email as string | undefined) ?? null, profile };
});

/** Redirects to /login when signed out, and to /onboarding until the profile is complete. */
export async function requireUser(nextPath?: string, { allowIncomplete = false } = {}): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
  if (user.profile.is_suspended) redirect("/suspended");
  if (!allowIncomplete && !user.profile.onboarded) redirect("/onboarding");
  return user;
}

export async function requireRole(roles: UserRole | UserRole[], nextPath?: string): Promise<SessionUser> {
  const user = await requireUser(nextPath);
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(user.profile.role)) redirect("/dashboard");
  return user;
}

export function dashboardPath(role: UserRole) {
  if (role === "admin") return "/admin";
  if (role === "tutor") return "/dashboard/tutor";
  return "/dashboard/student";
}
