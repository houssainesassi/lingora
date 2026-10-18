import Link from "next/link";

import { updateReportAction } from "@/app/admin/actions";
import { Input, Select } from "@/components/ui/form";
import { Badge, Card, EmptyState } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { REPORT_REASONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { cn, formatRelative } from "@/lib/utils";

export const metadata = { title: "Reports" };

const REASON_LABEL: Record<string, string> = Object.fromEntries(REPORT_REASONS.map((r) => [r.value, r.label]));

export default async function AdminReports({ searchParams }: PageProps<"/admin/reports">) {
  const sp = await searchParams;
  const showClosed = sp.view === "closed";
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("reports")
    .select("*, reporter:profiles!reports_reporter_id_fkey(full_name), reported:profiles!reports_reported_user_id_fkey(id, full_name), review:reviews(id, rating, comment, tutor_id)")
    .in("status", showClosed ? ["resolved", "dismissed"] : ["open", "reviewing"])
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <nav aria-label="Report filter" className="mb-4 flex gap-1">
        <Link href="/admin/reports" className={cn("rounded-lg px-3 py-1.5 text-sm", !showClosed ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}>
          Open
        </Link>
        <Link href="/admin/reports?view=closed" className={cn("rounded-lg px-3 py-1.5 text-sm", showClosed ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}>
          Closed
        </Link>
      </nav>
      {(reports ?? []).length === 0 ? (
        <EmptyState title={showClosed ? "No closed reports" : "No open reports"} />
      ) : (
        <ul className="space-y-3">
          {(reports ?? []).map((r) => (
            <li key={r.id}>
              <Card className="p-5 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="danger">{REASON_LABEL[r.reason] ?? r.reason}</Badge>
                  <Badge className="capitalize">{r.status}</Badge>
                  <span className="text-muted-foreground">
                    by {r.reporter?.full_name ?? "unknown"} · {formatRelative(r.created_at)}
                  </span>
                </div>
                <p className="mt-2">
                  {r.reported ? (
                    <>
                      Reported user: <span className="font-medium">{r.reported.full_name}</span>{" "}
                      <Link href={`/admin/users?q=${encodeURIComponent(r.reported.full_name)}`} className="text-primary hover:underline">
                        manage
                      </Link>
                    </>
                  ) : null}
                  {r.review ? (
                    <>
                      Reported review ({r.review.rating}/5): “{r.review.comment ?? "no comment"}”{" "}
                      <Link href="/admin/reviews" className="text-primary hover:underline">
                        moderate
                      </Link>
                    </>
                  ) : null}
                </p>
                {r.details ? <p className="mt-2 whitespace-pre-line rounded-lg bg-muted px-3 py-2">{r.details}</p> : null}
                <form action={updateReportAction} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="reportId" value={r.id} />
                  <label htmlFor={`note-${r.id}`} className="sr-only">
                    Admin note
                  </label>
                  <Input id={`note-${r.id}`} name="note" defaultValue={r.admin_note ?? ""} placeholder="Internal note" className="min-w-60 flex-1" maxLength={2000} />
                  <label htmlFor={`status-${r.id}`} className="sr-only">
                    Status
                  </label>
                  <Select id={`status-${r.id}`} name="status" defaultValue={r.status} className="w-36">
                    <option value="open">Open</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </Select>
                  <SubmitButton size="sm">Update</SubmitButton>
                </form>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
