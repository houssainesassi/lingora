import { SubmitForReviewButton } from "@/app/dashboard/tutor/submit-review-button";
import { Alert } from "@/components/ui/primitives";
import type { TutorStatus } from "@/lib/types";

export function TutorStatusAlert({ status, rejectionReason, canSubmit }: { status: TutorStatus; rejectionReason: string | null; canSubmit: boolean }) {
  if (status === "approved") {
    return (
      <Alert tone="success" title="Your profile is approved">
        Students can find you in search and book lessons.
      </Alert>
    );
  }
  if (status === "pending") {
    return (
      <Alert tone="info" title="Under review">
        An administrator is reviewing your profile. You can keep editing in the meantime.
      </Alert>
    );
  }
  if (status === "suspended") {
    return (
      <Alert tone="danger" title="Profile suspended">
        {rejectionReason ?? "Your profile is hidden from students. Contact support for details."}
      </Alert>
    );
  }
  return (
    <div className="space-y-3">
      <Alert tone={status === "rejected" ? "danger" : "warning"} title={status === "rejected" ? "Changes requested" : "Not yet submitted"}>
        {status === "rejected"
          ? rejectionReason ?? "Please update your profile and submit it again."
          : "Complete the required items and submit your profile. Students can see you once an administrator approves it."}
      </Alert>
      <SubmitForReviewButton disabled={!canSubmit} />
      {!canSubmit ? <p className="text-xs text-muted-foreground">Add a headline, an about text (50+ characters) and a language you teach first.</p> : null}
    </div>
  );
}
