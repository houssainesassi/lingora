"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { Alert } from "@/components/ui/primitives";
import type { ActionState } from "@/lib/types";

/** Inline message for a server action result, plus a toast on success. */
export function ActionFeedback({ state, toastOnSuccess = true }: { state: ActionState; toastOnSuccess?: boolean }) {
  const last = useRef<ActionState>(null);
  useEffect(() => {
    if (state && state !== last.current && state.ok && state.message && toastOnSuccess) {
      toast.success(state.message);
    }
    last.current = state;
  }, [state, toastOnSuccess]);

  if (!state || state.ok || !state.message) return null;
  return <Alert tone="danger">{state.message}</Alert>;
}
