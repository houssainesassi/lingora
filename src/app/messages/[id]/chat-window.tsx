"use client";

import { Loader2, SendHorizontal } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";
import { cn, friendlyDbError } from "@/lib/utils";

const PAGE = 50;

type Status = "connecting" | "live" | "offline";

export function ChatWindow({ conversationId, userId, initialMessages, timeZone, otherLastReadAt }: { conversationId: string; userId: string; initialMessages: Message[]; timeZone: string; otherLastReadAt: string | null }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder] = useState(initialMessages.length >= PAGE);
  const [status, setStatus] = useState<Status>("connecting");
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const addMessage = (m: Message) => setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m].sort((a, b) => a.created_at.localeCompare(b.created_at))));

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const m = payload.new as Message;
        addMessage(m);
        if (m.sender_id !== userId) {
          stickToBottom.current = true;
          void supabase.rpc("mark_conversation_read", { p_conversation_id: conversationId });
        }
      })
      .subscribe((s) => setStatus(s === "SUBSCRIBED" ? "live" : s === "CLOSED" || s === "CHANNEL_ERROR" || s === "TIMED_OUT" ? "offline" : "connecting"));
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    if (body.length > 4000) {
      toast.error("Messages can be at most 4000 characters.");
      return;
    }
    setSending(true);
    // RLS verifies that we are a participant and that sender_id is us.
    const { data, error } = await createClient().from("messages").insert({ conversation_id: conversationId, sender_id: userId, body }).select("*").single();
    setSending(false);
    if (error) {
      toast.error(friendlyDbError(error, "Message not sent. Please try again."));
      return;
    }
    stickToBottom.current = true;
    addMessage(data);
    setDraft("");
  }

  async function loadOlder() {
    const oldest = messages[0];
    if (!oldest) return;
    setLoadingOlder(true);
    const { data, error } = await createClient().from("messages").select("*").eq("conversation_id", conversationId).lt("created_at", oldest.created_at).order("created_at", { ascending: false }).limit(PAGE);
    setLoadingOlder(false);
    if (error) return toast.error("Could not load older messages.");
    stickToBottom.current = false;
    setHasOlder((data ?? []).length >= PAGE);
    setMessages((prev) => [...(data ?? []).reverse(), ...prev]);
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  };

  const timeFmt = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", timeZone });
  const dayFmt = new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long", timeZone });
  const lastOwn = [...messages].reverse().find((m) => m.sender_id === userId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {status === "offline" ? (
        <p role="status" className="bg-warning-soft px-4 py-1.5 text-center text-xs text-warning">
          Live updates paused. New messages will appear after you reconnect or refresh.
        </p>
      ) : null}
      <div ref={scrollRef} onScroll={onScroll} className="max-h-[60vh] min-h-[50vh] flex-1 space-y-1 overflow-y-auto px-4 py-4 md:max-h-[calc(70vh-8rem)]" aria-live="polite" aria-relevant="additions">
        {hasOlder ? (
          <div className="flex justify-center pb-2">
            <Button variant="ghost" size="sm" onClick={loadOlder} disabled={loadingOlder}>
              {loadingOlder ? <Loader2 className="animate-spin" aria-hidden="true" /> : null} Load earlier messages
            </Button>
          </div>
        ) : null}
        {messages.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">Say hello and introduce your goals.</p> : null}
        {messages.map((m, i) => {
          const mine = m.sender_id === userId;
          const day = dayFmt.format(new Date(m.created_at));
          const showDay = i === 0 || dayFmt.format(new Date(messages[i - 1].created_at)) !== day;
          return (
            <div key={m.id}>
              {showDay ? <p className="py-3 text-center text-xs font-medium text-muted-foreground">{day}</p> : null}
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2 text-sm", mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted")}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={cn("mt-0.5 text-right text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    <time dateTime={m.created_at}>{timeFmt.format(new Date(m.created_at))}</time>
                    {mine && m.id === lastOwn?.id && otherLastReadAt && otherLastReadAt >= m.created_at ? " · Seen" : null}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={send} className="flex items-end gap-2 border-t border-border p-3">
        <label htmlFor="message" className="sr-only">
          Write a message
        </label>
        <textarea
          id="message"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={4000}
          placeholder="Write a message… (Enter to send, Shift+Enter for a new line)"
          className="max-h-40 min-h-10 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus-visible:border-primary"
        />
        <Button type="submit" size="icon" disabled={sending || draft.trim().length === 0} aria-label="Send message">
          {sending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <SendHorizontal aria-hidden="true" />}
        </Button>
      </form>
    </div>
  );
}
