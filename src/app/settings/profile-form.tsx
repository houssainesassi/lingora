"use client";

import { useActionState, type ReactNode } from "react";

import { updateProfileAction } from "@/app/settings/actions";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field, Input, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function ProfileForm({ defaultName, defaultBio, countryField, timezoneField }: { defaultName: string; defaultBio: string; countryField: ReactNode; timezoneField: ReactNode }) {
  const [state, action] = useActionState(updateProfileAction, null);
  const fe = state?.fieldErrors;
  return (
    <form action={action} className="space-y-4" noValidate>
      <ActionFeedback state={state} />
      <Field id="fullName" label="Full name" error={fe?.fullName}>
        <Input id="fullName" name="fullName" defaultValue={defaultName} autoComplete="name" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        {countryField}
        {timezoneField}
      </div>
      <Field id="bio" label="Short bio (optional)" error={fe?.bio}>
        <Textarea id="bio" name="bio" defaultValue={defaultBio} maxLength={2000} rows={3} />
      </Field>
      <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
    </form>
  );
}
