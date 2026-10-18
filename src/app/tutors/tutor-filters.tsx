import { SlidersHorizontal } from "lucide-react";

import { CountrySelect } from "@/components/profile-fields";
import { ButtonLink } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Card } from "@/components/ui/primitives";
import { CEFR_DESCRIPTIONS, CEFR_LEVELS, SPECIALTIES } from "@/lib/constants";
import type { TutorFilters } from "@/lib/tutor-search";

/** Plain GET form: works without JavaScript and keeps filters in the URL. */
export function TutorFiltersForm({ filters, languages }: { filters: TutorFilters; languages: { code: string; name: string }[] }) {
  return (
    <Card className="p-5 lg:sticky lg:top-24">
      <form action="/tutors" method="get" className="space-y-4">
        <div className="flex items-center gap-2 font-semibold">
          <SlidersHorizontal className="size-4" aria-hidden="true" /> Filters
        </div>
        <Field id="q" label="Search by name">
          <Input id="q" name="q" type="search" defaultValue={filters.q ?? ""} placeholder="e.g. Camille" />
        </Field>
        <Field id="teaches" label="Language taught">
          <Select id="teaches" name="teaches" defaultValue={filters.teaches ?? ""}>
            <option value="">Any language</option>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="native" label="Native speaker of">
          <Select id="native" name="native" defaultValue={filters.native ?? ""}>
            <option value="">Any</option>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
        <CountrySelect label="Tutor’s country" defaultValue={filters.country} allowAny="Any country" />
        <Field id="level" label="Teaches level">
          <Select id="level" name="level" defaultValue={filters.level ?? ""}>
            <option value="">Any level</option>
            {CEFR_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l} · {CEFR_DESCRIPTIONS[l]}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="specialty" label="Specialty">
          <Select id="specialty" name="specialty" defaultValue={filters.specialty ?? ""}>
            <option value="">Any specialty</option>
            {SPECIALTIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <fieldset>
          <legend className="text-sm font-medium">Hourly price (USD)</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="minPrice" className="sr-only">
                Minimum price
              </label>
              <Input id="minPrice" name="minPrice" type="number" min={0} step={1} inputMode="numeric" placeholder="Min" defaultValue={filters.minPrice ?? ""} />
            </div>
            <div>
              <label htmlFor="maxPrice" className="sr-only">
                Maximum price
              </label>
              <Input id="maxPrice" name="maxPrice" type="number" min={0} step={1} inputMode="numeric" placeholder="Max" defaultValue={filters.maxPrice ?? ""} />
            </div>
          </div>
        </fieldset>
        <Field id="minRating" label="Minimum rating">
          <Select id="minRating" name="minRating" defaultValue={filters.minRating?.toString() ?? ""}>
            <option value="">Any (includes new tutors)</option>
            <option value="4.5">4.5 and up</option>
            <option value="4">4.0 and up</option>
            <option value="3">3.0 and up</option>
          </Select>
        </Field>
        <Field id="sort" label="Sort by">
          <Select id="sort" name="sort" defaultValue={filters.sort ?? "recommended"}>
            <option value="recommended">Recommended</option>
            <option value="rating">Highest rated</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </Select>
        </Field>
        <div className="flex gap-2 pt-1">
          <button type="submit" className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
            Apply filters
          </button>
          <ButtonLink href="/tutors" variant="ghost">
            Reset
          </ButtonLink>
        </div>
      </form>
    </Card>
  );
}
