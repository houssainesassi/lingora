import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** Lesson price from an hourly rate. Mirrors the SQL in request_booking. */
export function lessonPriceCents(hourlyRateCents: number, durationMinutes: number) {
  return Math.round((hourlyRateCents * durationMinutes) / 60);
}

export function initials(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
export function countryName(code: string | null | undefined) {
  if (!code) return null;
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export function countryFlag(code: string | null | undefined) {
  if (!code || !/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function formatDateTime(iso: string, timeZone: string, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
    ...opts,
  }).format(new Date(iso));
}

export function formatTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", timeZone }).format(new Date(iso));
}

export function formatRelative(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function minutesToLabel(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Keeps redirects on our own origin. */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/** Turns Postgres / PostgREST errors into user-facing text. */
export function friendlyDbError(error: { message?: string; code?: string } | null | undefined, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  if (error.code === "42501" && /row-level security|permission denied/i.test(error.message ?? "")) {
    return "You are not allowed to do that.";
  }
  if (error.code === "23505") return "This already exists.";
  if (error.code === "23P01") return error.message?.includes("exclusion constraint") ? "That time overlaps with another entry." : error.message ?? fallback;
  // Messages raised by our own SQL functions are written for end users.
  if (error.message && ["P0001", "P0002", "22023", "42501", "23514", "23P01"].includes(error.code ?? "")) return error.message;
  return fallback;
}
