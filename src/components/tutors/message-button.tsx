import { MessageSquare } from "lucide-react";

import { startConversationAction } from "@/app/tutors/actions";
import { SubmitButton } from "@/components/ui/submit-button";

export function MessageButton({ userId, returnTo, disabledReason, label = "Message", className, variant = "secondary" }: { userId: string; returnTo: string; disabledReason?: string; label?: string; className?: string; variant?: "secondary" | "primary" | "soft" }) {
  return (
    <form action={startConversationAction} className={className}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <SubmitButton variant={variant} className="w-full" disabled={Boolean(disabledReason)} title={disabledReason} pendingText="Opening…">
        <MessageSquare aria-hidden="true" />
        {label}
      </SubmitButton>
    </form>
  );
}
