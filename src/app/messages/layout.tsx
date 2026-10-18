import type { ReactNode } from "react";

import { ConversationList } from "@/app/messages/conversation-list";
import { Container } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Messages" };

export default async function MessagesLayout({ children }: { children: ReactNode }) {
  const user = await requireUser("/messages");
  const supabase = await createClient();
  const { data: conversations, error } = await supabase.rpc("get_my_conversations", { p_limit: 100 });

  return (
    <Container className="flex flex-1 flex-col py-6">
      <div className="grid min-h-[70vh] flex-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:grid-cols-[320px_1fr]">
        <ConversationList userId={user.id} conversations={conversations ?? []} loadError={Boolean(error)} />
        <div className="flex min-h-0 min-w-0 flex-col">{children}</div>
      </div>
    </Container>
  );
}
