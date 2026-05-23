"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket-client";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  X,
  ArrowLeft,
  Send,
  Paperclip,
  FileText,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatUser {
  id: string;
  name: string;
  email: string;
  role: string;
  subRole?: string | null;
  department: string | null;
  avatar?: string | null;
}

interface MessageAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

interface ChatMessage {
  id: string;
  body: string;
  senderId: string;
  sender: { id: string; name: string; avatar?: string | null };
  createdAt: string;
  attachments: MessageAttachment[];
}

interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  participants: {
    userId: string;
    user: ChatUser;
    lastReadAt?: string | null;
  }[];
  lastMessage: {
    id: string;
    body: string;
    senderId: string;
    sender: { id: string; name: string; avatar?: string | null };
    createdAt: string;
  } | null;
  hasUnread: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDeptName(dept: string | null): string {
  const map: Record<string, string> = {
    AUDIT: "Audit & Advisory",
    ACCOUNTING_TAX: "Accounting & Tax",
    BOOKKEEPING_PAYROLL: "Bookkeeping & Payroll",
    LEGAL: "Legal Advisory",
    ADVISORY: "Advisory Services",
    HR: "HR & Payroll",
    MARKETING: "Marketing",
    FINANCE: "Finance",
  };
  return dept ? map[dept] || dept : "All";
}

function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatPopup() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  // Popup state
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");

  // Data
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Message input
  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Typing
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Unread count
  const [unreadCount, setUnreadCount] = useState(0);

  // Socket refs
  const socketJoinedRef = useRef(false);
  const activeConvRef = useRef<string | null>(null);

  // ---- Scroll to bottom ----
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  // ---- Fetch conversations ----
  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const { data } = await axios.get("/api/chat/conversations");
      setConversations(data.conversations);
      const count = data.conversations.filter(
        (c: Conversation) => c.hasUnread
      ).length;
      setUnreadCount(count);
    } catch {
      // Silently fail for popup
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  // ---- Fetch messages ----
  const fetchMessages = useCallback(
    async (convId: string) => {
      setLoadingMessages(true);
      try {
        const { data } = await axios.get(
          `/api/chat/conversations/${convId}/messages`
        );
        setMessages(data.messages);
        scrollToBottom();
      } catch {
        toast.error("Failed to load messages");
      } finally {
        setLoadingMessages(false);
      }
    },
    [scrollToBottom]
  );

  // ---- Socket setup ----
  useEffect(() => {
    if (!currentUserId) return;

    const socket = getSocket();

    if (!socketJoinedRef.current) {
      socket.emit("join", currentUserId);
      socketJoinedRef.current = true;
    }

    const handleNotification = (data: any) => {
      // If we're currently viewing this conversation, add the message
      if (data.conversationId === activeConvRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.messageId)) return prev;
          const newMsg: ChatMessage = {
            id: data.messageId,
            body: data.body,
            senderId: data.senderId,
            sender: { id: data.senderId, name: data.senderName },
            createdAt: data.createdAt,
            attachments: data.attachments || [],
          };
          return [...prev, newMsg];
        });
        scrollToBottom();
      } else {
        // Show toast for messages not in active popup conversation
        if (data.senderId !== currentUserId) {
          toast(`New message from ${data.senderName}`, {
            description:
              data.body?.slice(0, 60) + (data.body?.length > 60 ? "..." : ""),
            action: {
              label: "View",
              onClick: () => {
                setIsOpen(true);
                // We'd need the conversation object - just refresh
                fetchConversations();
              },
            },
          });
        }
      }
      // Update unread count
      fetchConversations();
    };

    const handleTyping = (data: any) => {
      if (data.conversationId === activeConvRef.current) {
        setTypingUser(data.userName);
      }
    };

    const handleStopTyping = (data: any) => {
      if (data.conversationId === activeConvRef.current) {
        setTypingUser(null);
      }
    };

    socket.on("new-message", handleNotification);
    socket.on("chat-notification", handleNotification);
    socket.on("user-typing", handleTyping);
    socket.on("user-stop-typing", handleStopTyping);

    return () => {
      socket.off("new-message", handleNotification);
      socket.off("chat-notification", handleNotification);
      socket.off("user-typing", handleTyping);
      socket.off("user-stop-typing", handleStopTyping);
    };
  }, [currentUserId, scrollToBottom, fetchConversations]);

  // ---- Load conversations when popup opens ----
  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen, fetchConversations]);

  // ---- Initial fetch for unread count ----
  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
    }
  }, [currentUserId, fetchConversations]);

  // ---- Open a conversation in popup ----
  const openConversation = async (conv: Conversation) => {
    const socket = getSocket();

    // Leave previous
    if (activeConvRef.current) {
      socket.emit("leave-conversation", activeConvRef.current);
    }

    setActiveConvId(conv.id);
    setActiveConv(conv);
    activeConvRef.current = conv.id;
    setView("chat");
    setTypingUser(null);

    socket.emit("join-conversation", conv.id);
    await fetchMessages(conv.id);
    fetchConversations();
  };

  // ---- Go back to list ----
  const goBack = () => {
    const socket = getSocket();
    if (activeConvRef.current) {
      socket.emit("leave-conversation", activeConvRef.current);
    }
    setActiveConvId(null);
    setActiveConv(null);
    activeConvRef.current = null;
    setView("list");
    setMessages([]);
    setTypingUser(null);
    fetchConversations();
  };

  // ---- Send message ----
  const handleSend = async () => {
    if ((!messageText.trim() && attachments.length === 0) || !activeConvId)
      return;

    const body = messageText.trim();
    setSending(true);

    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      body,
      senderId: currentUserId!,
      sender: { id: currentUserId!, name: session?.user?.name || "You" },
      createdAt: new Date().toISOString(),
      attachments: [],
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setMessageText("");
    scrollToBottom();

    try {
      const formData = new FormData();
      formData.append("body", body);
      attachments.forEach((file) => formData.append("attachments", file));

      const { data } = await axios.post(
        `/api/chat/conversations/${activeConvId}/messages`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? data.message : m))
      );
      setAttachments([]);
      scrollToBottom();

      const socket = getSocket();
      const otherParticipants = activeConv?.participants
        .filter((p) => p.userId !== currentUserId)
        .map((p) => p.userId);

      socket.emit("send-message", {
        conversationId: activeConvId,
        messageId: data.message.id,
        senderId: currentUserId,
        senderName: session?.user?.name,
        body,
        createdAt: data.message.createdAt,
        attachments: data.message.attachments,
        recipientIds: otherParticipants,
      });

      fetchConversations();
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setMessageText(body);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // ---- Typing ----
  const handleTypingEvent = () => {
    if (!activeConvId || !currentUserId) return;
    const socket = getSocket();
    socket.emit("typing", {
      conversationId: activeConvId,
      userId: currentUserId,
      userName: session?.user?.name || "Someone",
    });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("stop-typing", {
        conversationId: activeConvId,
        userId: currentUserId,
      });
    }, 2000);
  };

  // ---- Get other participant ----
  const getOtherParticipant = (conv: Conversation): ChatUser | null => {
    const other = conv.participants.find((p) => p.userId !== currentUserId);
    return other?.user || null;
  };

  const activeChatUser = activeConv ? getOtherParticipant(activeConv) : null;

  if (!currentUserId) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-brand-700 active:scale-95"
      >
        <MessageSquare className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popup panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl transition-all duration-300 ${
          isOpen
            ? "h-[500px] w-[350px] opacity-100 scale-100"
            : "h-0 w-0 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b bg-brand-600 px-4 py-3 text-white">
          {view === "chat" && activeChatUser ? (
            <div className="flex items-center gap-2">
              <button onClick={goBack} className="hover:bg-white/20 rounded p-1">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                  <span className="text-xs font-medium">
                    {activeChatUser.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">
                    {activeChatUser.name}
                  </p>
                  {typingUser && (
                    <p className="text-[10px] text-white/70 italic animate-pulse">
                      typing...
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-sm font-semibold">Messages</span>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="rounded p-1 hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {view === "list" ? (
          // ---- Conversation list ----
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-brand-600 dark:text-brand-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">
                  No conversations yet
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const other = getOtherParticipant(conv);
                return (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv)}
                    className="w-full border-b px-3 py-2.5 text-left transition-colors hover:bg-muted/50 last:border-b-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100/70 dark:bg-brand-900/40">
                        <span className="text-xs font-medium text-brand-600 dark:text-brand-400">
                          {other?.name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs truncate ${
                              conv.hasUnread
                                ? "font-semibold text-foreground"
                                : "font-medium text-foreground/80"
                            }`}
                          >
                            {other?.name || "Unknown"}
                          </span>
                          {conv.lastMessage && (
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {timeAgo(conv.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                            {conv.lastMessage.senderId === currentUserId
                              ? "You: "
                              : ""}
                            {conv.lastMessage.body.slice(0, 40)}
                            {conv.lastMessage.body.length > 40 ? "..." : ""}
                          </p>
                        )}
                      </div>
                      {conv.hasUnread && (
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                          !
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          // ---- Chat view ----
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-600 dark:text-brand-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <p className="text-xs text-muted-foreground">
                    No messages yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => {
                    const isOwn = msg.senderId === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${
                          isOwn ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl px-3 py-2 ${
                            isOwn
                              ? "rounded-br-sm bg-brand-600 text-white"
                              : "rounded-bl-sm bg-muted"
                          }`}
                        >
                          <p
                            className={`text-xs leading-relaxed whitespace-pre-wrap ${
                              isOwn ? "text-white/95" : "text-foreground"
                            }`}
                          >
                            {msg.body}
                          </p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {msg.attachments.map((att) => (
                                <a
                                  key={att.id}
                                  href={att.filePath}
                                  target="_blank"
                                  className={`inline-flex items-center gap-1 px-2 py-1 border rounded text-[10px] ${
                                    isOwn
                                      ? "bg-white/20 border-white/30 text-white"
                                      : "bg-card/80 border-border"
                                  }`}
                                >
                                  <FileText className="h-3 w-3" />
                                  <span className="max-w-[80px] truncate">
                                    {att.fileName}
                                  </span>
                                </a>
                              ))}
                            </div>
                          )}
                          <p
                            className={`mt-1 text-[9px] ${
                              isOwn
                                ? "text-white/50"
                                : "text-muted-foreground/60"
                            }`}
                          >
                            {timeAgo(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="shrink-0 border-t px-3 py-2">
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {attachments.map((file, i) => (
                    <div
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-[10px]"
                    >
                      <Paperclip className="h-2.5 w-2.5" />
                      <span className="max-w-[80px] truncate">{file.name}</span>
                      <button
                        onClick={() =>
                          setAttachments((prev) =>
                            prev.filter((_, idx) => idx !== i)
                          )
                        }
                        className="text-muted-foreground hover:text-red-500 ml-0.5"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setAttachments((prev) => [
                        ...prev,
                        ...Array.from(e.target.files!),
                      ]);
                      e.target.value = "";
                    }
                  }}
                />
                <textarea
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    handleTypingEvent();
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSend();
                    }
                    // Also send on just Enter (no shift) for popup chat
                    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={
                    sending ||
                    (!messageText.trim() && attachments.length === 0)
                  }
                  className="shrink-0 rounded-lg bg-brand-600 p-2 text-white disabled:opacity-50 hover:bg-brand-700 transition-colors"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
