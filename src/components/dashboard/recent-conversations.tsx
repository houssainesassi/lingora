import { MessageSquare } from "lucide-react";
import Link from "next/link";

import { Avatar, Card, CardHeader, EmptyState } from "@/components/ui/primitives";
import type { Database } from "@/lib/supabase/database.types";
import { formatRelative } from "@/lib/utils";

type Conversation = Database["public"]["Functions"]["get_my_conversations"]["Returns"][number];

export function RecentConversations({ conversations, title = "Recent conversations" }: { conversations: Conversation[]; title?: string }) {
  return (
    <Card>
      <CardHeader
        title={title}
        action={
          <Link href="/messages" className="text-sm text-primary hover:underline">
            All messages
          </Link>
        }
      />
      {conversations.length === 0 ? (
        <div className="p-5">
          <EmptyState icon={<MessageSquare />} title="No conversations yet" />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {conversations.slice(0, 5).map((c) => (
            <li key={c.conversation_id}>
              <Link href={`/messages/${c.conversation_id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/60">
                <Avatar src={c.other_avatar_url} name={c.other_name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.other_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.last_message_preview ?? "No messages yet"}</p>
                </div>
                <div className="text-right">
                  {c.last_message_at ? <p className="text-xs text-muted-foreground">{formatRelative(c.last_message_at)}</p> : null}
                  {Number(c.unread_count) > 0 ? <span className="mt-0.5 inline-block rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white">{Number(c.unread_count)} new</span> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
