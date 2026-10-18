"use client";

import { Check, CheckCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { cancelBookingAction, completeBookingAction, requestRescheduleAction, respondBookingAction, respondRescheduleAction } from "@/app/bookings/actions";
import { SlotPicker } from "@/components/bookings/slot-picker";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/form";
import type { ActionState } from "@/lib/types";

interface Props {
  bookingId: string;
  tutorId: string;
  duration: number;
  timeZone: string;
  canRespond: boolean;
  canCancel: boolean;
  cancelBlockedReason: string | null;
  canReschedule: boolean;
  canComplete: boolean;
  rescheduleIncoming: boolean;
  rescheduleOutgoing: boolean;
}

export function BookingActions(p: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<null | "decline" | "cancel" | "reschedule">(null);
  const [reason, setReason] = useState("");
  const [newSlot, setNewSlot] = useState<string | null>(null);

  const run = (fn: () => Promise<ActionState>) =>
    startTransition(async () => {
      const res = await fn();
      if (res?.ok) {
        toast.success(res.message);
        setMode(null);
        setReason("");
        setNewSlot(null);
        router.refresh();
      } else {
        toast.error(res?.message ?? "Something went wrong.");
      }
    });

  const nothing = !p.canRespond && !p.canCancel && !p.canReschedule && !p.canComplete && !p.rescheduleIncoming && !p.rescheduleOutgoing;
  if (nothing && !p.cancelBlockedReason) return null;

  return (
    <div className="space-y-4">
      {p.rescheduleIncoming ? (
        <div className="flex flex-wrap gap-2">
          <Button disabled={pending} onClick={() => run(() => respondRescheduleAction(p.bookingId, true))}>
            <Check aria-hidden="true" /> Accept new time
          </Button>
          <Button variant="secondary" disabled={pending} onClick={() => run(() => respondRescheduleAction(p.bookingId, false))}>
            Keep original time
          </Button>
        </div>
      ) : null}
      {p.rescheduleOutgoing ? (
        <Button variant="secondary" disabled={pending} onClick={() => run(() => respondRescheduleAction(p.bookingId, false))}>
          Withdraw my new-time proposal
        </Button>
      ) : null}

      {mode === null ? (
        <div className="flex flex-wrap gap-2">
          {p.canRespond ? (
            <>
              <Button disabled={pending} onClick={() => run(() => respondBookingAction(p.bookingId, true))}>
                <Check aria-hidden="true" /> Accept request
              </Button>
              <Button variant="danger-outline" disabled={pending} onClick={() => setMode("decline")}>
                <X aria-hidden="true" /> Decline
              </Button>
            </>
          ) : null}
          {p.canComplete ? (
            <Button disabled={pending} onClick={() => run(() => completeBookingAction(p.bookingId))}>
              <CheckCheck aria-hidden="true" /> Mark as completed
            </Button>
          ) : null}
          {p.canReschedule && !p.rescheduleOutgoing && !p.rescheduleIncoming ? (
            <Button variant="secondary" disabled={pending} onClick={() => setMode("reschedule")}>
              Propose a new time
            </Button>
          ) : null}
          {p.canCancel ? (
            <Button variant="danger-outline" disabled={pending} onClick={() => setMode("cancel")}>
              Cancel lesson
            </Button>
          ) : null}
        </div>
      ) : null}
      {p.cancelBlockedReason && mode === null ? <p className="text-sm text-muted-foreground">{p.cancelBlockedReason}</p> : null}

      {mode === "decline" || mode === "cancel" ? (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <Field id="reason" label={mode === "decline" ? "Reason for declining (shared with the student)" : "Reason for cancelling (shared with the other participant)"}>
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={2} />
          </Field>
          <div className="flex gap-2">
            <Button
              variant="danger"
              disabled={pending}
              onClick={() => run(() => (mode === "decline" ? respondBookingAction(p.bookingId, false, reason) : cancelBookingAction(p.bookingId, reason)))}
            >
              {mode === "decline" ? "Decline request" : "Cancel lesson"}
            </Button>
            <Button variant="ghost" onClick={() => setMode(null)}>
              Back
            </Button>
          </div>
        </div>
      ) : null}

      {mode === "reschedule" ? (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <p className="text-sm font-medium">Choose a new time</p>
          <SlotPicker tutorId={p.tutorId} duration={p.duration} timeZone={p.timeZone} value={newSlot} onChange={setNewSlot} ignoreBookingId={p.bookingId} />
          <div className="flex gap-2">
            <Button disabled={pending || !newSlot} onClick={() => newSlot && run(() => requestRescheduleAction(p.bookingId, newSlot))}>
              Send proposal
            </Button>
            <Button variant="ghost" onClick={() => setMode(null)}>
              Back
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
