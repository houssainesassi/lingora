"use client";

import { useActionState } from "react";

import { saveTutorProfileAction } from "@/app/dashboard/tutor/actions";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { CEFR_DESCRIPTIONS, CEFR_LEVELS, LESSON_DURATIONS, SPECIALTIES } from "@/lib/constants";
import type { TutorProfile } from "@/lib/types";

export function TutorProfileForm({ tutor }: { tutor: TutorProfile }) {
  const [state, action] = useActionState(saveTutorProfileAction, null);
  const fe = state?.fieldErrors;
  return (
    <form action={action} className="space-y-5" noValidate>
      <ActionFeedback state={state} />
      <Field id="headline" label="Headline" hint="One line that tells students what you offer." error={fe?.headline}>
        <Input id="headline" name="headline" defaultValue={tutor.headline} maxLength={120} required aria-describedby="headline-hint" />
      </Field>
      <Field id="about" label="About me" hint="Your background, teaching style and what a lesson with you looks like." error={fe?.about}>
        <Textarea id="about" name="about" defaultValue={tutor.about} rows={7} maxLength={4000} required aria-describedby="about-hint" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="experience" label="Years of teaching experience" error={fe?.experience}>
          <Input id="experience" name="experience" type="number" min={0} max={60} defaultValue={tutor.teaching_experience_years} />
        </Field>
        <Field id="hourlyRate" label={`Hourly rate (${tutor.currency})`} hint="Lesson prices are calculated from this rate." error={fe?.hourlyRate}>
          <Input id="hourlyRate" name="hourlyRate" type="number" min={5} max={500} step={0.5} defaultValue={tutor.hourly_rate_cents / 100} aria-describedby="hourlyRate-hint" />
        </Field>
      </div>
      <Field id="certifications" label="Certifications (optional)" hint="For example: CELTA, DELF examiner, university degree." error={fe?.certifications}>
        <Textarea id="certifications" name="certifications" defaultValue={tutor.certifications ?? ""} rows={2} maxLength={2000} aria-describedby="certifications-hint" />
      </Field>

      <fieldset>
        <legend className="text-sm font-medium">Lesson lengths you offer</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {LESSON_DURATIONS.map((d) => (
            <label key={d} className="flex items-center gap-2 text-sm">
              <Checkbox name="durations" value={d} defaultChecked={tutor.lesson_durations.includes(d)} /> {d} minutes
            </label>
          ))}
        </div>
        {fe?.durations ? <p className="mt-1 text-xs font-medium text-danger">{fe.durations[0]}</p> : null}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">Levels you teach</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CEFR_LEVELS.map((l) => (
            <label key={l} className="flex items-center gap-2 text-sm">
              <Checkbox name="levels" value={l} defaultChecked={tutor.levels_taught.includes(l)} /> {l} · {CEFR_DESCRIPTIONS[l]}
            </label>
          ))}
        </div>
        {fe?.levels ? <p className="mt-1 text-xs font-medium text-danger">{fe.levels[0]}</p> : null}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">Specialties</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SPECIALTIES.map((s) => (
            <label key={s.value} className="flex items-center gap-2 text-sm">
              <Checkbox name="specialties" value={s.value} defaultChecked={tutor.specialties.includes(s.value)} /> {s.label}
            </label>
          ))}
        </div>
      </fieldset>

      <SubmitButton pendingText="Saving…">Save tutor profile</SubmitButton>
    </form>
  );
}
