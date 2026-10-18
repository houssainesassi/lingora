"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { submitForReviewAction } from "@/app/dashboard/tutor/actions";
import { Button } from "@/components/ui/button";

export function SubmitForReviewButton({ disabled }: { disabled?: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button
      disabled={disabled || pending}
      onClick={() =>
        start(async () => {
          const res = await submitForReviewAction();
          if (res?.ok) {
            toast.success(res.message);
            router.refresh();
          } else toast.error(res?.message ?? "Could not submit.");
        })
      }
    >
      <Send aria-hidden="true" /> Submit for review
    </Button>
  );
}
