"use client";

import { useActionState } from "react";

import { saveTutorLanguageAction } from "@/app/dashboard/tutor/actions";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Checkbox, Field, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { CEFR_LEVELS } from "@/lib/constants";

export function TutorLanguageForm({ languages }: { languages: { code: string; name: string }[] }) {
  const [state, action] = useActionState(saveTutorLanguageAction, null);
  return (
    <form action={action} className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
      <ActionFeedback state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="tl-language" label="Language">
          <Select id="tl-language" name="language" defaultValue={languages[0]?.code}>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="tl-proficiency" label="Your level (if not native)" error={state?.fieldErrors?.proficiency}>
          <Select id="tl-proficiency" name="proficiency" defaultValue="">
            <option value="">Native speaker</option>
            {CEFR_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <Checkbox name="teaches" defaultChecked /> I teach this language
        </label>
        <label className="flex items-center gap-2">
          <Checkbox name="isNative" /> I am a native speaker
        </label>
      </div>
      <SubmitButton size="sm" variant="secondary" pendingText="Saving…">
        Add or update language
      </SubmitButton>
    </form>
  );
}
