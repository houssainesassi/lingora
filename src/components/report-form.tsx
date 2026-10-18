"use client";

import { Flag } from "lucide-react";
import { useActionState, useState } from "react";

import { submitReportAction } from "@/app/reports/actions";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { REPORT_REASONS } from "@/lib/constants";

export function ReportForm({ reportedUserId, reviewId, label = "Report a problem" }: { reportedUserId?: string; reviewId?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(submitReportAction, null);

  if (state?.ok) return <p className="text-sm text-success">{state.message}</p>;
  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="text-muted-foreground">
        <Flag aria-hidden="true" /> {label}
      </Button>
    );
  }
  return (
    <form action={action} className="space-y-3 rounded-xl border border-border p-4">
      <input type="hidden" name="reportedUserId" value={reportedUserId ?? ""} />
      <input type="hidden" name="reviewId" value={reviewId ?? ""} />
      <ActionFeedback state={state} toastOnSuccess={false} />
      <Field id="report-reason" label="Reason">
        <Select id="report-reason" name="reason" defaultValue="">
          <option value="" disabled>
            Choose a reason
          </option>
          {REPORT_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="report-details" label="Details (optional)">
        <Textarea id="report-details" name="details" maxLength={2000} rows={3} />
      </Field>
      <div className="flex gap-2">
        <SubmitButton size="sm" variant="danger" pendingText="Sending…">
          Send report
        </SubmitButton>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
