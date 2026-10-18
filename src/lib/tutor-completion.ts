import type { TutorProfile } from "@/lib/types";

export interface CompletionItem {
  label: string;
  done: boolean;
  required: boolean;
}

/** Checklist shown on the tutor dashboard. Required items match the DB submission check. */
export function tutorCompletion(opts: { tutor: TutorProfile; avatarUrl: string | null; country: string | null; teachesCount: number; availabilityCount: number }) {
  const { tutor } = opts;
  const items: CompletionItem[] = [
    { label: "Headline", done: tutor.headline.trim().length >= 5, required: true },
    { label: "About me (50+ characters)", done: tutor.about.trim().length >= 50, required: true },
    { label: "At least one language you teach", done: opts.teachesCount > 0, required: true },
    { label: "Levels you teach", done: tutor.levels_taught.length > 0, required: false },
    { label: "Specialties", done: tutor.specialties.length > 0, required: false },
    { label: "Profile photo", done: Boolean(opts.avatarUrl), required: false },
    { label: "Country", done: Boolean(opts.country), required: false },
    { label: "Weekly availability", done: opts.availabilityCount > 0, required: false },
  ];
  const percent = Math.round((items.filter((i) => i.done).length / items.length) * 100);
  const canSubmit = items.filter((i) => i.required).every((i) => i.done);
  return { items, percent, canSubmit };
}
