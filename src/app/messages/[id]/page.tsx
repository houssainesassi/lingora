import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChatWindow } from "@/app/messages/[id]/chat-window";
import { Avatar } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";

export default async function ConversationPage({ params }: PageProps<"/messages/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/messages/${id}`);
  if (!uuidSchema.safeParse(id).success) notFound();

  const supabase = await createClient();
  // RLS: only participants can read the conversation and its messages.
  const { data: participants } = await supabase.from("conversation_participants").select("user_id, last_read_at").eq("conversation_id", id);
  if (!participants || !participants.some((p) => p.user_id === user.id)) notFound();
  const otherId = participants.find((p) => p.user_id !== user.id)?.user_id;

  const [{ data: other }, { data: messages }, { data: tutor }] = await Promise.all([
    otherId ? supabase.from("profiles").select("id, full_name, avatar_url, role").eq("id", otherId).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: false }).limit(50),
    otherId ? supabase.from("tutor_profiles").select("id, status").eq("id", otherId).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  await supabase.rpc("mark_conversation_read", { p_conversation_id: id });
  const otherLastRead = participants.find((p) => p.user_id === otherId)?.last_read_at ?? null;

  return (
    <>
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href="/messages" className="grid size-9 place-items-center rounded-lg hover:bg-muted md:hidden" aria-label="Back to conversations">
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
        <Avatar src={other?.avatar_url} name={other?.full_name} size={40} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{other?.full_name || "User"}</p>
          <p className="text-xs capitalize text-muted-foreground">{other?.role ?? ""}</p>
        </div>
        {tutor?.status === "approved" ? (
          <Link href={`/tutors/${tutor.id}`} className="ml-auto text-sm text-primary hover:underline">
            View profile
          </Link>
        ) : null}
      </header>
      <ChatWindow key={id} conversationId={id} userId={user.id} initialMessages={(messages ?? []).reverse()} timeZone={user.profile.timezone} otherLastReadAt={otherLastRead} />
    </>
  );
}
