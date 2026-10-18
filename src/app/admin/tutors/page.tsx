import Link from "next/link";

import { reviewTutorAction } from "@/app/admin/actions";
import { TutorDocsList } from "@/app/admin/tutors/tutor-docs";
import { Avatar, Badge, Card, EmptyState } from "@/components/ui/primitives";
import { Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { createClient } from "@/lib/supabase/server";
import type { TutorStatus } from "@/lib/types";
import { cn, formatPrice, formatRelative } from "@/lib/utils";

const FILTERS: TutorStatus[] = ["pending", "approved", "rejected", "suspended", "draft"];

export const metadata = { title: "Tutor applications" };

export default async function AdminTutors({ searchParams }: PageProps<"/admin/tutors">) {
  const sp = await searchParams;
  const status = (FILTERS.find((f) => f === sp.status) ?? "pending") as TutorStatus;
  const supabase = await createClient();
  const { data: tutors } = await supabase
    .from("tutor_profiles")
    .select("*, profile:profiles!tutor_profiles_id_fkey(full_name, avatar_url, country), tutor_languages(language_code, teaches, is_native, proficiency)")
    .eq("status", status)
    .order("submitted_at", { ascending: true, nullsFirst: false })
    .limit(50);

  const docsByTutor = new Map<string, string[]>();
  await Promise.all(
    (tutors ?? []).map(async (t) => {
      const { data } = await supabase.storage.from("tutor-documents").list(t.id, { limit: 20 });
      docsByTutor.set(t.id, (data ?? []).filter((d) => d.id).map((d) => d.name));
    }),
  );

  return (
    <div>
      <nav aria-label="Status" className="mb-4 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <Link key={f} href={`/admin/tutors?status=${f}`} aria-current={f === status ? "page" : undefined} className={cn("rounded-lg px-3 py-1.5 text-sm capitalize", f === status ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}>
            {f}
          </Link>
        ))}
      </nav>
      {(tutors ?? []).length === 0 ? (
        <EmptyState title={`No ${status} tutors`} />
      ) : (
        <ul className="space-y-4">
          {(tutors ?? []).map((t) => (
            <li key={t.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <Avatar src={t.profile?.avatar_url} name={t.profile?.full_name} size={56} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/tutors/${t.id}`} className="font-semibold hover:underline">
                        {t.profile?.full_name || "Unnamed"}
                      </Link>
                      <Badge className="capitalize">{t.status}</Badge>
                      {t.is_demo ? <Badge tone="warning">Demo</Badge> : null}
                      {t.submitted_at ? <span className="text-xs text-muted-foreground">submitted {formatRelative(t.submitted_at)}</span> : null}
                    </div>
                    <p className="mt-1 text-sm font-medium">{t.headline || "No headline"}</p>
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{t.about || "No about text"}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatPrice(t.hourly_rate_cents, t.currency)}/h · {t.teaching_experience_years} yrs · Languages:{" "}
                      {t.tutor_languages.map((l) => `${l.language_code}${l.is_native ? " (native)" : l.proficiency ? ` (${l.proficiency})` : ""}${l.teaches ? "*" : ""}`).join(", ") || "none"} · * teaches
                    </p>
                    {t.certifications ? <p className="mt-1 text-xs text-muted-foreground">Certifications: {t.certifications}</p> : null}
                    <TutorDocsList tutorId={t.id} names={docsByTutor.get(t.id) ?? []} />
                  </div>
                </div>
                <form action={reviewTutorAction} className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  <input type="hidden" name="tutorId" value={t.id} />
                  <label htmlFor={`reason-${t.id}`} className="sr-only">
                    Reason (shown to the tutor when rejecting or suspending)
                  </label>
                  <Input id={`reason-${t.id}`} name="reason" placeholder="Reason for rejection / suspension (shown to tutor)" className="min-w-60 flex-1" maxLength={1000} />
                  {t.status !== "approved" ? (
                    <SubmitButton name="decision" value="approved" size="sm">
                      Approve
                    </SubmitButton>
                  ) : null}
                  {t.status === "pending" ? (
                    <SubmitButton name="decision" value="rejected" size="sm" variant="danger-outline">
                      Reject
                    </SubmitButton>
                  ) : null}
                  {t.status === "approved" ? (
                    <SubmitButton name="decision" value="suspended" size="sm" variant="danger-outline">
                      Suspend
                    </SubmitButton>
                  ) : null}
                </form>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
