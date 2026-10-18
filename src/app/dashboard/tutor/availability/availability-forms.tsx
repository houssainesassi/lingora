"use client";

import { useActionState, useState } from "react";

import { addAvailabilityAction, addTimeOffAction } from "@/app/dashboard/tutor/actions";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { WEEKDAYS } from "@/lib/constants";

export function AddAvailabilityForm() {
  const [state, action] = useActionState(addAvailabilityAction, null);
  return (
    <form action={action} className="space-y-4">
      <ActionFeedback state={state} />
      <fieldset>
        <legend className="text-sm font-medium">Days</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {WEEKDAYS.map((d, i) => (
            <label key={d} className="flex items-center gap-1.5 text-sm">
              <Checkbox name="weekdays" value={i} defaultChecked={i >= 1 && i <= 5} /> {d.slice(0, 3)}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
        <Field id="start" label="From" error={state?.fieldErrors?.start}>
          <Input id="start" name="start" type="time" step={1800} defaultValue="17:00" required />
        </Field>
        <Field id="end" label="Until" error={state?.fieldErrors?.end}>
          <Input id="end" name="end" type="time" step={1800} defaultValue="21:00" required />
        </Field>
      </div>
      <SubmitButton pendingText="Adding…">Add time window</SubmitButton>
    </form>
  );
}

/** Converts datetime-local values (in the tutor's browser time zone) to ISO strings. */
export function AddTimeOffForm() {
  const [state, action] = useActionState(addTimeOffAction, null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const iso = (v: string) => (v ? new Date(v).toISOString() : "");
  return (
    <form action={action} className="space-y-4">
      <ActionFeedback state={state} />
      <input type="hidden" name="startsAt" value={iso(start)} />
      <input type="hidden" name="endsAt" value={iso(end)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="off-start" label="From">
          <Input id="off-start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
        </Field>
        <Field id="off-end" label="Until">
          <Input id="off-end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required />
        </Field>
      </div>
      <Field id="off-note" label="Note (private, optional)">
        <Input id="off-note" name="note" maxLength={200} />
      </Field>
      <SubmitButton variant="secondary" disabled={!start || !end} pendingText="Saving…">
        Block this time
      </SubmitButton>
    </form>
  );
}
