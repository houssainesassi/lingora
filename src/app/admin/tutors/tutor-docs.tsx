"use client";

import { FileText } from "lucide-react";
import { toast } from "sonner";

import { getTutorDocumentUrlAction } from "@/app/admin/actions";

/** Opens private certificates through short-lived signed URLs. */
export function TutorDocsList({ tutorId, names }: { tutorId: string; names: string[] }) {
  if (names.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {names.map((n) => (
        <li key={n}>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted"
            onClick={async () => {
              const url = await getTutorDocumentUrlAction(tutorId, n);
              if (url) window.open(url, "_blank", "noopener,noreferrer");
              else toast.error("Could not open the document.");
            }}
          >
            <FileText className="size-3.5" aria-hidden="true" /> {n.replace(/^\d+-/, "")}
          </button>
        </li>
      ))}
    </ul>
  );
}
