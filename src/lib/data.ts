import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Language, TutorLanguageInfo } from "@/lib/types";

export const getLanguages = cache(async (): Promise<Language[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("languages").select("*").eq("is_active", true).order("sort_order").order("name");
  if (error) throw new Error(`Could not load languages: ${error.message}`);
  return data;
});

export const getSettings = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.from("platform_settings").select("key, value");
  const map = new Map((data ?? []).map((r) => [r.key, r.value]));
  const num = (key: string, fallback: number) => {
    const v = Number(map.get(key));
    return Number.isFinite(v) ? v : fallback;
  };
  return {
    minNoticeHours: num("min_booking_notice_hours", 12),
    studentCancelWindowHours: num("student_cancel_window_hours", 24),
    bookingHorizonDays: num("booking_horizon_days", 60),
    joinEarlyMinutes: num("join_early_minutes", 10),
  };
});

export function parseTutorLanguages(value: unknown): TutorLanguageInfo[] {
  return Array.isArray(value) ? (value as TutorLanguageInfo[]) : [];
}
