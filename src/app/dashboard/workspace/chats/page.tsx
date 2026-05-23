"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  FileText,
  Loader2,
  Users,
  Clock,
  Download,
  ArrowLeft,
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
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getFileIcon(mimeType: string) {
  if (mimeType === "application/pdf")
    return <FileText className="h-3.5 w-3.5 text-red-500" />;
  if (mimeType.includes("word"))
    return <FileText className="h-3.5 w-3.5 text-blue-500" />;
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
    return <FileText className="h-3.5 w-3.5 text-green-500" />;
  return <FileText className="h-3.5 w-3.5 text-muted-foreground" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/** Deduplicate messages by id, keeping the non-temp version */
function deduplicateMessages(msgs: ChatMessage[]): ChatMessage[] {
  const map = new Map<string, ChatMessage>();
  for (const msg of msgs) {
    const existing = map.get(msg.id);
    // Prefer non-temp messages over temp ones
    if (!existing || existing.id.startsWith("temp-")) {
      map.set(msg.id, msg);
    }
  }
  return Array.from(map.values());
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function ListSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse space-y-2 rounded-lg bg-muted/60 p-4"
        >
          <div className="h-3.5 w-1/3 rounded bg-muted-foreground/20" />
          <div className="h-3 w-2/3 rounded bg-muted-foreground/15" />
        </div>
      ))}
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-xl p-4 ${
            i % 2 === 0 ? "mr-16 bg-muted/60" : "ml-16 bg-brand-100/70 dark:bg-brand-900/40"
          }`}
        >
          <div className="mb-2 h-3 w-24 rounded bg-muted-foreground/20" />
          <div className="mb-1 h-3 w-full rounded bg-muted-foreground/15" />
          <div className="h-3 w-3/4 rounded bg-muted-foreground/10" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Department options for filter
// ---------------------------------------------------------------------------

const DEPARTMENT_OPTIONS = [
  { value: "", label: "All Departments" },
  { value: "AUDIT", label: "Audit & Advisory" },
  { value: "ACCOUNTING_TAX", label: "Accounting & Tax" },
  { value: "BOOKKEEPING_PAYROLL", label: "Bookkeeping & Payroll" },
  { value: "LEGAL", label: "Legal Advisory" },
  { value: "ADVISORY", label: "Advisory Services" },
  { value: "HR", label: "HR & Payroll" },
  { value: "MARKETING", label: "Marketing" },
  { value: "FINANCE", label: "Finance" },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ChatsPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  // Tab state
  const [activeTab, setActiveTab] = useState<"recent" | "people">("recent");

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);

  // People
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [deptFilter, setDeptFilter] = useState("");

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Active conversation
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Typing indicator
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Socket ref
  const socketJoinedRef = useRef(false);
  const activeConvRef = useRef<string | null>(null);

  // ---- Debounced search ----
  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setSearch(value), 400);
  };

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
    } catch {
      toast.error("Failed to load conversations");
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  // ---- Fetch users ----
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search;
      if (deptFilter) params.department = deptFilter;
      const { data } = await axios.get("/api/chat/users", { params });
      setUsers(data.users);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, [search, deptFilter]);

  // ---- Fetch messages ----
  const fetchMessages = useCallback(
    async (convId: string) => {
      setLoadingMessages(true);
      try {
        const { data } = await axios.get(
          `/api/chat/conversations/${convId}/messages`
        );
        setMessages(deduplicateMessages(data.messages));
        scrollToBottom();
      } catch {
        toast.error("Failed to load messages");
      } finally {
        setLoadingMessages(false);
      }
    },
    [scrollToBottom]
  );

  // ---- Load initial data ----
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeTab === "people") {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  // ---- Socket setup ----
  useEffect(() => {
    if (!currentUserId) return;

    const socket = getSocket();

    if (!socketJoinedRef.current) {
      socket.emit("join", currentUserId);
      socketJoinedRef.current = true;
      console.log("[ChatsPage] Joined user room:", currentUserId);
    }

    const handleNewMessage = (data: any) => {
      if (data.conversationId === activeConvRef.current) {
        // Don't add if we already have it (optimistic update)
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.messageId)) return prev;
          const newMsg: ChatMessage = {
            id: data.messageId,
            body: data.body,
            senderId: data.senderId,
            sender: {
              id: data.senderId,
              name: data.senderName,
            },
            createdAt: data.createdAt,
            attachments: data.attachments || [],
          };
          return deduplicateMessages([...prev, newMsg]);
        });
        scrollToBottom();
      }
      // Update conversation list
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

    socket.on("new-message", handleNewMessage);
    socket.on("chat-notification", handleNewMessage);
    socket.on("user-typing", handleTyping);
    socket.on("user-stop-typing", handleStopTyping);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("chat-notification", handleNewMessage);
      socket.off("user-typing", handleTyping);
      socket.off("user-stop-typing", handleStopTyping);
    };
  }, [currentUserId, scrollToBottom, fetchConversations]);

  // ---- Open conversation ----
  const openConversation = useCallback(
    async (conv: Conversation) => {
      const socket = getSocket();

      // Leave previous conversation room
      if (activeConvRef.current) {
        socket.emit("leave-conversation", activeConvRef.current);
      }

      setActiveConvId(conv.id);
      setActiveConv(conv);
      activeConvRef.current = conv.id;
      setTypingUser(null);

      // Join new conversation room
      socket.emit("join-conversation", conv.id);

      // Fetch messages
      await fetchMessages(conv.id);

      // Refresh conversations to clear unread
      fetchConversations();
    },
    [fetchMessages, fetchConversations]
  );

  // ---- Start conversation with a user ----
  const startConversation = useCallback(
    async (userId: string) => {
      try {
        const { data } = await axios.post("/api/chat/conversations", {
          userId,
        });
        const conv = data.conversation;
        // Add conversation to list if not there
        setConversations((prev) => {
          if (prev.some((c) => c.id === conv.id)) return prev;
          return [conv, ...prev];
        });
        // Open it
        await openConversation(conv);
        // Switch to recent tab
        setActiveTab("recent");
      } catch {
        toast.error("Failed to start conversation");
      }
    },
    [openConversation]
  );

  // ---- Send message ----
  const handleSend = async () => {
    if ((!messageText.trim() && attachments.length === 0) || !activeConvId)
      return;

    const body = messageText.trim();
    setSending(true);

    // Optimistic update
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      body,
      senderId: currentUserId!,
      sender: {
        id: currentUserId!,
        name: session?.user?.name || "You",
      },
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

      // Replace optimistic message with real one and deduplicate
      setMessages((prev) =>
        deduplicateMessages(
          prev.map((m) => (m.id === optimisticMsg.id ? data.message : m))
        )
      );
      setAttachments([]);
      scrollToBottom();

      // Emit via socket for real-time
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

      // Refresh conversation list
      fetchConversations();
    } catch {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setMessageText(body);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // ---- Typing indicator ----
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

  // ---- Active conversation's other participant ----
  const activeChatUser = activeConv ? getOtherParticipant(activeConv) : null;

  // ---- Render ----
  const myDeptDisplayName = getDeptName(session?.user?.department || null);

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-brand-700 dark:text-brand-400">
            Chats
          </h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Team conversations &middot; message your colleagues
          </p>
        </div>
        <span className="inline-flex items-center self-start rounded-full border border-brand-200/60 bg-brand-100/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:border-brand-800/50 dark:bg-brand-900/40 dark:text-brand-300 md:self-auto">
          {myDeptDisplayName}
        </span>
      </div>

      {/* Main split layout */}
      <div className="flex flex-col md:flex-row flex-1 gap-4 min-h-0">
        {/* ====== LEFT PANEL: User/Conversation List (40%) ====== */}
        <Card className="flex w-full md:w-[40%] md:min-w-[320px] flex-col overflow-hidden min-h-[300px] md:min-h-0">
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Search..."
                className="h-9 w-full rounded-lg border border-border bg-muted/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("recent")}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "recent"
                  ? "border-b-2 border-brand-500 text-brand-600 dark:text-brand-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
              Recent Chats
            </button>
            <button
              onClick={() => setActiveTab("people")}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "people"
                  ? "border-b-2 border-brand-500 text-brand-600 dark:text-brand-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
              People
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "recent" ? (
              // ---- Recent Chats ----
              loadingConversations ? (
                <ListSkeleton />
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <MessageSquare className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    No conversations yet
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Go to People tab to start a chat
                  </p>
                </div>
              ) : (
                <ul className="space-y-1.5 p-2">
                  {conversations
                  .filter((conv) => {
                    if (!search.trim()) return true;
                    const other = getOtherParticipant(conv);
                    return other?.name
                      ?.toLowerCase()
                      .includes(search.toLowerCase());
                  })
                  .map((conv) => {
                    const other = getOtherParticipant(conv);
                    const isSelected = conv.id === activeConvId;
                    return (
                      <li key={conv.id}>
                      <button
                        onClick={() => openConversation(conv)}
                        className={`group relative w-full rounded-lg border bg-card px-3 py-3 text-left transition-colors ${
                          isSelected
                            ? "bg-brand-50/40 dark:bg-brand-950/30 border-brand-200/60 dark:border-brand-800/50"
                            : "hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                                {other?.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`truncate text-sm ${
                                      conv.hasUnread
                                        ? "font-semibold text-foreground"
                                        : "font-medium text-foreground/80"
                                    }`}
                                  >
                                    {other?.name || "Unknown"}
                                  </span>
                                  {conv.lastMessage && (
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                      {timeAgo(conv.lastMessage.createdAt)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {other?.subRole || other?.role}
                                  {other?.department && (
                                    <>
                                      {" "}
                                      &middot; {getDeptName(other.department)}
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                            {conv.lastMessage && (
                              <p className="mt-1.5 pl-[3.25rem] truncate text-xs text-muted-foreground">
                                {conv.lastMessage.senderId === currentUserId
                                  ? "You: "
                                  : ""}
                                {conv.lastMessage.body.slice(0, 60)}
                                {conv.lastMessage.body.length > 60 ? "..." : ""}
                              </p>
                            )}
                          </div>
                          {conv.hasUnread && (
                            <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                              !
                            </span>
                          )}
                        </div>
                      </button>
                      </li>
                    );
                  })}
                </ul>
              )
            ) : (
              // ---- People ----
              <>
                {/* Department filter */}
                <div className="p-3 border-b border-border">
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  >
                    {DEPARTMENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {loadingUsers ? (
                  <ListSkeleton />
                ) : users.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <Users className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      No users found
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1.5 p-2">
                    {users.map((user) => (
                    <li key={user.id}>
                    <button
                      onClick={() => startConversation(user.id)}
                      className="group w-full rounded-lg border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                          {user.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.subRole || user.role}
                          </p>
                        </div>
                        {user.department && (
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-[10px]"
                          >
                            {getDeptName(user.department)}
                          </Badge>
                        )}
                      </div>
                    </button>
                    </li>
                  ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </Card>

        {/* ====== RIGHT PANEL: Active Conversation (60%) ====== */}
        <Card className={`flex flex-1 flex-col overflow-hidden min-h-[400px] md:min-h-0 ${!activeConvId ? "hidden md:flex" : ""}`}>
          {!activeConvId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <MessageSquare className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <p className="font-medium text-muted-foreground">
                Select a conversation
              </p>
              <p className="text-sm text-muted-foreground/60">
                Choose a chat from the list or start a new one
              </p>
            </div>
          ) : (
            <>
              {/* Conversation header */}
              {activeChatUser && (
                <div className="shrink-0 border-b border-border bg-muted/20 px-4 md:px-6 py-4">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveConvId(null);
                      setActiveConv(null);
                      activeConvRef.current = null;
                    }}
                    className="md:hidden mb-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to chats
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                      {activeChatUser.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-semibold text-foreground">
                        {activeChatUser.name}
                      </h2>
                      <p className="truncate text-xs text-muted-foreground">
                        {activeChatUser.subRole || activeChatUser.role}
                        {activeChatUser.department && (
                          <>
                            {" "}
                            &middot; {getDeptName(activeChatUser.department)}
                          </>
                        )}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Online
                    </span>
                  </div>
                  {typingUser && (
                    <p className="mt-1 text-xs italic text-brand-600 dark:text-brand-400 animate-pulse">
                      {typingUser} is typing...
                    </p>
                  )}
                </div>
              )}

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
                {loadingMessages ? (
                  <MessagesSkeleton />
                ) : messages.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      No messages yet
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      Send a message to start the conversation
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deduplicateMessages(messages).map((msg) => {
                      const isOwn = msg.senderId === currentUserId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${
                            isOwn ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                              isOwn
                                ? "rounded-br-md bg-brand-600 text-white"
                                : "rounded-bl-md bg-muted"
                            }`}
                          >
                            <div
                              className={`mb-1 flex items-center justify-between gap-4 text-xs ${
                                isOwn
                                  ? "text-white/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <span className="font-medium">
                                {isOwn ? "You" : msg.sender.name}
                              </span>
                              <span>{timeAgo(msg.createdAt)}</span>
                            </div>
                            <p
                              className={`text-sm leading-relaxed whitespace-pre-wrap ${
                                isOwn ? "text-white/95" : "text-foreground"
                              }`}
                            >
                              {msg.body}
                            </p>
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {msg.attachments.map((att) => (
                                  <div
                                    key={att.id}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs transition-colors ${
                                      isOwn
                                        ? "bg-white/20 border-white/30 text-white"
                                        : "bg-card/80 border-border"
                                    }`}
                                  >
                                    {getFileIcon(att.mimeType)}
                                    <span className="max-w-[150px] truncate">
                                      {att.fileName}
                                    </span>
                                    <span
                                      className={
                                        isOwn ? "text-white/50" : "text-muted-foreground"
                                      }
                                    >
                                      ({formatFileSize(att.fileSize)})
                                    </span>
                                    <a
                                      href={`/api/attachments/${att.id}`}
                                      download={att.fileName}
                                      className={`ml-1 p-0.5 rounded hover:bg-black/10 ${
                                        isOwn ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground/80"
                                      }`}
                                      title="Download"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message input */}
              <div className="shrink-0 border-t border-border bg-muted/20 px-4 md:px-6 py-4">
                <textarea
                  ref={textareaRef}
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    handleTypingEvent();
                  }}
                  placeholder="Type a message..."
                  rows={2}
                  className="w-full resize-y min-h-[60px] max-h-[150px] rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {attachments.map((file, i) => (
                      <div
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted rounded text-xs"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span className="max-w-[120px] truncate">
                          {file.name}
                        </span>
                        <button
                          onClick={() =>
                            setAttachments((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                          className="text-muted-foreground hover:text-red-500 ml-1"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.csv"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const newFiles = Array.from(e.target.files);
                      setAttachments((prev) => [...prev, ...newFiles]);
                      toast.success(`${newFiles.length} file(s) attached`);
                      e.target.value = "";
                    }
                  }}
                />
                <div className="flex items-center justify-between mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 rounded-xl text-sm"
                  >
                    <Paperclip className="h-4 w-4" />
                    {attachments.length > 0 ? `${attachments.length} file(s)` : "Attach"}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleSend}
                      disabled={
                        sending ||
                        (!messageText.trim() && attachments.length === 0)
                      }
                      className="gap-2 rounded-xl bg-brand-600 px-5 py-3 text-white hover:bg-brand-700"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {sending ? "Sending..." : "Send"}
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground/50">
                  Press Ctrl+Enter to send
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
