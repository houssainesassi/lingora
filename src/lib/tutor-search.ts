import { z } from "zod";

import { CEFR_LEVELS, PAGE_SIZE } from "@/lib/constants";
import type { CefrLevel } from "@/lib/types";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const optionalNumber = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined));

export const tutorFiltersSchema = z.object({
  q: optionalText(80),
  teaches: optionalText(10),
  native: optionalText(10),
  country: optionalText(2).refine((v) => !v || /^[A-Z]{2}$/.test(v)).catch(undefined),
  level: z.enum(CEFR_LEVELS as unknown as [CefrLevel, ...CefrLevel[]]).optional().catch(undefined),
  specialty: optionalText(40),
  minPrice: optionalNumber,
  maxPrice: optionalNumber,
  minRating: optionalNumber,
  sort: z.enum(["recommended", "price_asc", "price_desc", "rating"]).optional().catch(undefined),
  page: optionalNumber,
});

export type TutorFilters = Partial<z.infer<typeof tutorFiltersSchema>>;

export function parseTutorFilters(searchParams: Record<string, string | string[] | undefined>): TutorFilters {
  const flat = Object.fromEntries(Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const parsed = tutorFiltersSchema.safeParse(flat);
  return parsed.success ? parsed.data : {};
}

/** Maps UI filters to search_tutors() arguments (prices are whole currency units in the UI). */
export function toSearchArgs(f: TutorFilters) {
  const page = Math.max(1, Math.floor(f.page ?? 1));
  return {
    page,
    args: {
      p_query: f.q,
      p_teaches: f.teaches,
      p_native: f.native,
      p_country: f.country,
      p_level: f.level,
      p_specialty: f.specialty,
      p_min_price: f.minPrice !== undefined ? Math.round(f.minPrice * 100) : undefined,
      p_max_price: f.maxPrice !== undefined ? Math.round(f.maxPrice * 100) : undefined,
      p_min_rating: f.minRating,
      p_sort: f.sort ?? "recommended",
      p_limit: PAGE_SIZE,
      p_offset: (page - 1) * PAGE_SIZE,
    },
  };
}

export function filtersToQuery(f: TutorFilters, overrides: Partial<Record<keyof TutorFilters, string | number | undefined>> = {}) {
  const params = new URLSearchParams();
  const merged = { ...f, ...overrides } as Record<string, string | number | undefined>;
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== "" && !(k === "page" && Number(v) <= 1)) params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}
