"use client";

import { useActionState } from "react";

import { saveStudentLanguageAction, updateLearningGoalsAction } from "@/app/settings/actions";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { CEFR_DESCRIPTIONS, CEFR_LEVELS } from "@/lib/constants";

export function LearningGoalsForm({ defaultValue }: { defaultValue: string }) {
  const [state, action] = useActionState(updateLearningGoalsAction, null);
  return (
    <form action={action} className="space-y-3">
      <ActionFeedback state={state} />
      <label htmlFor="learningGoals" className="sr-only">
        Learning goals
      </label>
      <Textarea id="learningGoals" name="learningGoals" defaultValue={defaultValue} maxLength={2000} rows={4} placeholder="e.g. Order food and chat with locals on my trip to Lisbon in June." />
      <SubmitButton size="sm" variant="secondary" pendingText="Saving…">
        Save goals
      </SubmitButton>
    </form>
  );
}

export function StudentLanguageForm({ languages }: { languages: { code: string; name: string }[] }) {
  const [state, action] = useActionState(saveStudentLanguageAction, null);
  return (
    <form action={action} className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
      <ActionFeedback state={state} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field id="sl-language" label="Language">
          <Select id="sl-language" name="language">
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="sl-current" label="Current level">
          <Select id="sl-current" name="currentLevel" defaultValue="A1">
            {CEFR_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l} · {CEFR_DESCRIPTIONS[l]}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="sl-target" label="Target level">
          <Select id="sl-target" name="targetLevel" defaultValue="">
            <option value="">Not set</option>
            {CEFR_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field id="sl-goal" label="Goal for this language (optional)">
        <Input id="sl-goal" name="goal" maxLength={500} />
      </Field>
      <SubmitButton size="sm" variant="secondary" pendingText="Saving…">
        Add or update language
      </SubmitButton>
    </form>
  );
}
