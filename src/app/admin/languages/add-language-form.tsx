"use client";

import { useActionState } from "react";

import { addLanguageAction } from "@/app/admin/actions";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function AddLanguageForm() {
  const [state, action] = useActionState(addLanguageAction, null);
  return (
    <form action={action} className="space-y-3">
      <ActionFeedback state={state} />
      <Field id="code" label="ISO code" hint="e.g. nl, ja, pt-br">
        <Input id="code" name="code" required maxLength={12} />
      </Field>
      <Field id="name" label="English name">
        <Input id="name" name="name" required maxLength={60} />
      </Field>
      <Field id="nativeName" label="Native name (optional)">
        <Input id="nativeName" name="nativeName" maxLength={60} />
      </Field>
      <Field id="sortOrder" label="Sort order">
        <Input id="sortOrder" name="sortOrder" type="number" defaultValue={100} min={0} />
      </Field>
      <SubmitButton pendingText="Adding…">Add language</SubmitButton>
    </form>
  );
}
