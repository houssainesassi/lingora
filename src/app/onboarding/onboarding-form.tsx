"use client";

import { useActionState, useState, type ReactNode } from "react";

import { completeOnboardingAction } from "@/app/settings/actions";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { CEFR_DESCRIPTIONS, CEFR_LEVELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function OnboardingForm({
  defaultName,
  defaultRole,
  isAdmin,
  languages,
  countryField,
  timezoneField,
}: {
  defaultName: string;
  defaultRole: "student" | "tutor";
  isAdmin: boolean;
  languages: { code: string; name: string }[];
  countryField: ReactNode;
  timezoneField: ReactNode;
}) {
  const [state, action] = useActionState(completeOnboardingAction, null);
  const [role, setRole] = useState(defaultRole);
  const fe = state?.fieldErrors;

  return (
    <form action={action} className="mt-6 space-y-5" noValidate>
      <ActionFeedback state={state} />
      {!isAdmin ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">I want to</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["student", "tutor"] as const).map((r) => (
              <label
                key={r}
                className={cn(
                  "cursor-pointer rounded-xl border p-3 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                  role === r ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-muted",
                )}
              >
                <input className="sr-only" type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} />
                {r === "student" ? "Learn a language" : "Teach a language"}
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <input type="hidden" name="role" value="student" />
      )}

      <Field id="fullName" label="Full name" error={fe?.fullName}>
        <Input id="fullName" name="fullName" defaultValue={defaultName} required autoComplete="name" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        {countryField}
        {timezoneField}
      </div>

      {role === "student" && !isAdmin ? (
        <div className="space-y-4 rounded-xl border border-border bg-muted/40 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="learnLanguage" label="Language you want to learn">
              <Select id="learnLanguage" name="learnLanguage" defaultValue="">
                <option value="">Choose later</option>
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="learnLevel" label="Your current level">
              <Select id="learnLevel" name="learnLevel" defaultValue="A1">
                {CEFR_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l} · {CEFR_DESCRIPTIONS[l]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field id="learningGoals" label="What do you want to achieve?" hint="For example: hold a 10 minute conversation at work.">
            <Textarea id="learningGoals" name="learningGoals" maxLength={2000} aria-describedby="learningGoals-hint" />
          </Field>
        </div>
      ) : null}

      {role === "tutor" && !isAdmin ? (
        <p className="rounded-xl bg-primary-soft px-4 py-3 text-sm text-[#312e81]">
          Next you will complete your tutor profile. An administrator reviews new tutors before they appear in search.
        </p>
      ) : null}

      <SubmitButton className="w-full" pendingText="Saving…">
        Continue
      </SubmitButton>
    </form>
  );
}
