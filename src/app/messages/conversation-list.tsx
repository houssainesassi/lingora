"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Avatar } from "@/components/ui/primitives";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { useHydrated } from "@/lib/hooks";
import { cn, formatRelative } from "@/lib/utils";

type Conversation = Database["public"]["Functions"]["get_my_conversations"]["Returns"][number];

export function ConversationList({ userId, conversations, loadError }: { userId: string; conversations: Conversation[]; loadError: boolean }) {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const hydrated = useHydrated();
  const activeId = params.id;

  // Any new message in one of my conversations (RLS filters the stream) refreshes the list.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`inbox:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => router.refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return (
    <aside aria-label="Conversations" className={cn("flex min-h-0 flex-col border-border md:border-r", activeId ? "hidden md:flex" : "flex")}>
      <div className="border-b border-border px-4 py-4">
        <h1 className="text-lg font-semibold">Messages</h1>
      </div>
      {loadError ? <p className="p-4 text-sm text-danger">Could not load conversations.</p> : null}
      {conversations.length === 0 && !loadError ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No conversations yet.{" "}
          <Link className="text-primary underline" href="/tutors">
            Find a tutor
          </Link>{" "}
          and send them a message.
        </div>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {conversations.map((c) => {
            const unread = Number(c.unread_count);
            const active = c.conversation_id === activeId;
            return (
              <li key={c.conversation_id}>
                <Link
                  href={`/messages/${c.conversation_id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn("flex gap-3 border-b border-border/60 px-4 py-3 hover:bg-muted", active && "bg-primary-soft hover:bg-primary-soft")}
                >
                  <Avatar src={c.other_avatar_url} name={c.other_name} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>{c.other_name || "User"}</p>
                      {c.last_message_at && hydrated ? <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(c.last_message_at)}</span> : null}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("truncate text-sm", unread ? "text-foreground" : "text-muted-foreground")}>
                        {c.last_message_preview ? `${c.last_message_sender === userId ? "You: " : ""}${c.last_message_preview}` : "No messages yet"}
                      </p>
                      {unread > 0 ? (
                        <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold leading-5 text-white">
                          {unread}
                          <span className="sr-only"> unread messages</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
