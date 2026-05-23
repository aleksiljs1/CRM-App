"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  MessageSquare,
  Send,
  Users,
  X,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface ContactUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
}

interface Contact {
  user: ContactUser;
  relationship: "manager" | "task";
  context: string;
}

interface ChatMessage {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; name: string };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function timeShort(date: string): string {
  const d = new Date(date);
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m`;
  const hrs = Math.floor(diffMins / 60);
  if (hrs < 24) return `${hrs}h`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Outer section: header + contact cards + modal mount ─────────────────────

export function TeamChatSection() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);

  useEffect(() => {
    let cancelled = false;
    axios
      .get("/api/client/contacts")
      .then((res) => {
        if (!cancelled) setContacts(res.data.contacts || []);
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load your team contacts");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <div className="flex items-center gap-1.5">
        <Users className="size-3 text-muted-foreground" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Talk to your team
        </span>
      </div>

      {loading ? (
        <div className="mt-3 flex items-center justify-center rounded-xl border bg-card py-10 shadow-sm">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="mt-3 rounded-xl border bg-card p-6 text-center shadow-sm">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-muted">
            <MessageSquare className="size-6 text-muted-foreground" />
          </span>
          <p className="text-sm font-medium text-foreground">
            No team contacts yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Once your account has a manager or open tasks, the people you can
            chat with will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {contacts.map((c) => (
            <ContactCard
              key={`${c.user.id}-${c.relationship}`}
              contact={c}
              onMessage={() => setActiveContact(c)}
            />
          ))}
        </div>
      )}

      {activeContact && (
        <ChatModal
          contact={activeContact}
          onClose={() => setActiveContact(null)}
        />
      )}
    </section>
  );
}

// ── One contact card ────────────────────────────────────────────────────────

function ContactCard({
  contact,
  onMessage,
}: {
  contact: Contact;
  onMessage: () => void;
}) {
  const isManager = contact.relationship === "manager";
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
        {getInitials(contact.user.name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {contact.user.name}
          </p>
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              isManager
                ? "bg-brand-100/70 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            }`}
          >
            {contact.user.role}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {contact.context}
        </p>
      </div>
      <Button
        size="sm"
        onClick={onMessage}
        className="shrink-0 gap-1.5 bg-brand-600 text-white hover:bg-brand-700"
      >
        <MessageSquare className="size-3.5" />
        Message
      </Button>
    </div>
  );
}

// ── Chat modal ──────────────────────────────────────────────────────────────

function ChatModal({
  contact,
  onClose,
}: {
  contact: Contact;
  onClose: () => void;
}) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const meUserIdRef = useRef<string | null>(null);

  // 1) On open: ensure the conversation exists + load its history.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const convRes = await axios.post("/api/chat/conversations", {
          userId: contact.user.id,
        });
        if (cancelled) return;
        const conv = convRes.data.conversation;
        setConversationId(conv.id);

        // The "other participant" is the contact; "me" is the OTHER one.
        const me = conv.participants?.find(
          (p: { userId: string }) => p.userId !== contact.user.id
        );
        if (me) meUserIdRef.current = me.userId;

        const msgRes = await axios.get(
          `/api/chat/conversations/${conv.id}/messages`
        );
        if (cancelled) return;
        setMessages(msgRes.data.messages || []);
      } catch {
        if (!cancelled) {
          toast.error("Couldn't open the conversation");
          onClose();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contact.user.id, onClose]);

  // 2) Auto-scroll to bottom when new messages arrive.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, loading]);

  async function handleSend() {
    if (!conversationId || sending) return;
    const trimmed = body.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("body", trimmed);
      const res = await axios.post(
        `/api/chat/conversations/${conversationId}/messages`,
        fd
      );
      setMessages((prev) => [...prev, res.data.message]);
      setBody("");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-[80vh] md:h-[600px] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              {getInitials(contact.user.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {contact.user.name}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {contact.context}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
        >
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
                <MessageSquare className="size-6 text-muted-foreground" />
              </span>
              <p className="mt-3 text-sm font-medium text-foreground">
                Start the conversation
              </p>
              <p className="mt-1 max-w-[14rem] text-xs text-muted-foreground">
                Send a message to {contact.user.name.split(" ")[0]} to get
                started.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.senderId !== contact.user.id;
              return (
                <div
                  key={m.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      isMine
                        ? "bg-brand-600 text-white"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p
                      className={`mt-1 text-[10px] tabular-nums ${
                        isMine ? "text-white/70" : "text-muted-foreground"
                      }`}
                    >
                      {timeShort(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Composer */}
        <div className="flex items-end gap-2 border-t border-border p-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message…"
            className="min-h-[44px] flex-1 resize-none text-sm"
            disabled={sending || loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!body.trim() || sending || loading}
            className="gap-1.5 bg-brand-600 text-white hover:bg-brand-700"
          >
            {sending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
