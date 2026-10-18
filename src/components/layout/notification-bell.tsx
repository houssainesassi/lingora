"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

/**
 * Unread notification counter. Subscribes to new rows through Supabase
 * Realtime (RLS limits the stream to the current user's notifications).
 */
export function NotificationBell({ userId, initialUnread }: { userId: string; initialUnread: number }) {
  const [unread, setUnread] = useState(initialUnread);
  const [prevInitial, setPrevInitial] = useState(initialUnread);
  const router = useRouter();

  if (initialUnread !== prevInitial) {
    setPrevInitial(initialUnread);
    setUnread(initialUnread);
  }

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as { title: string; body: string | null; link: string | null; type: string };
          setUnread((c) => c + 1);
          // Chat pages show messages live already; avoid duplicate toasts there.
          if (n.type === "message" && n.link && window.location.pathname === n.link) return;
          toast(n.title, {
            description: n.body ?? undefined,
            action: n.link ? { label: "Open", onClick: () => router.push(n.link!) } : undefined,
          });
          router.refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return (
    <Link
      href="/notifications"
      className="relative grid size-10 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
    >
      <Bell className="size-5" aria-hidden="true" />
      {unread > 0 ? (
        <span aria-hidden="true" className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-4 text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
