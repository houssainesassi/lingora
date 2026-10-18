import { z } from "zod";

import { CEFR_LEVELS, LESSON_DURATIONS, SPECIALTIES } from "@/lib/constants";

export const cefr = z.enum(CEFR_LEVELS as unknown as [string, ...string[]]);

export const emailSchema = z.email({ message: "Enter a valid email address" }).max(254);
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use at most 72 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name").max(100),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["student", "tutor"]),
  timezone: z.string().max(64).optional(),
  terms: z.literal("on", { message: "Please accept the terms to continue" }),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name").max(100),
  country: z
    .string()
    .regex(/^[A-Z]{2}$/, "Choose a country")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  timezone: z.string().min(1).max(64),
  bio: z.string().trim().max(2000).optional(),
});

export const learningSchema = z.object({
  learningGoals: z.string().trim().max(2000).optional(),
});

export const tutorProfileSchema = z.object({
  headline: z.string().trim().min(5, "Add a short headline (5+ characters)").max(120),
  about: z.string().trim().min(50, "Tell students about yourself (50+ characters)").max(4000),
  experience: z.coerce.number().int().min(0).max(60),
  certifications: z.string().trim().max(2000).optional(),
  hourlyRate: z.coerce.number().min(5, "Minimum is 5").max(500, "Maximum is 500"),
  durations: z.array(z.coerce.number().refine((n) => (LESSON_DURATIONS as readonly number[]).includes(n))).min(1, "Offer at least one lesson length"),
  specialties: z.array(z.enum(SPECIALTIES.map((s) => s.value) as [string, ...string[]])).max(12),
  levels: z.array(cefr).min(1, "Select at least one level you teach"),
});

export const uuidSchema = z.uuid();

/** Collects a FormData into a plain object, turning repeated keys into arrays. */
export function formToObject(formData: FormData, arrayKeys: string[] = []) {
  const out: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    if (key.startsWith("$ACTION")) continue;
    const values = formData.getAll(key).filter((v): v is string => typeof v === "string");
    out[key] = arrayKeys.includes(key) ? values : values[0];
  }
  for (const key of arrayKeys) out[key] ??= [];
  return out;
}

export function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
}
