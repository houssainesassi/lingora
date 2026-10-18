import { Bell, X } from "lucide-react";
import Link from "next/link";

import { deleteNotificationAction, markNotificationReadAction } from "@/app/notifications/actions";
import { Container, EmptyState, PageHeader } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cn, formatRelative } from "@/lib/utils";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser("/notifications");
  const supabase = await createClient();
  const { data: notifications } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
  const list = notifications ?? [];
  const unread = list.filter((n) => !n.read_at).length;

  return (
    <Container className="max-w-3xl py-10">
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : "You’re all caught up."}
        action={
          unread ? (
            <form action={markNotificationReadAction}>
              <SubmitButton variant="secondary" pendingText="Updating…">
                Mark all as read
              </SubmitButton>
            </form>
          ) : null
        }
      />
      {list.length === 0 ? (
        <EmptyState icon={<Bell />} title="No notifications" description="Booking updates, messages and reviews will show up here." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {list.map((n) => (
            <li key={n.id} className={cn("flex items-start gap-3 px-5 py-4", !n.read_at && "bg-primary-soft/40")}>
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-primary")} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", !n.read_at && "font-semibold")}>
                  {n.link ? (
                    <Link href={n.link} className="hover:underline">
                      {n.title}
                    </Link>
                  ) : (
                    n.title
                  )}
                  {!n.read_at ? <span className="sr-only"> (unread)</span> : null}
                </p>
                {n.body ? <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">{formatRelative(n.created_at)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {!n.read_at ? (
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="id" value={n.id} />
                    <button type="submit" className="rounded-lg px-2 py-1 text-xs text-primary hover:bg-primary-soft">
                      Mark read
                    </button>
                  </form>
                ) : null}
                <form action={deleteNotificationAction}>
                  <input type="hidden" name="id" value={n.id} />
                  <button type="submit" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="Delete notification">
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
