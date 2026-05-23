"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { getSocket } from "@/lib/socket-client";
import {
  X,
  Send,
  Paperclip,
  FileText,
  Loader2,
  Minus,
  Download,
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

interface ChatPopupState {
  conversationId: string;
  otherUser: { id: string; name: string };
  isExpanded: boolean;
  messages: ChatMessage[];
  unreadCount: number;
  conversation: Conversation | null;
  loadingMessages: boolean;
  flash: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

/** Deduplicate messages by id, keeping the non-temp version if both exist */
function deduplicateMessages(msgs: ChatMessage[]): ChatMessage[] {
  const map = new Map<string, ChatMessage>();
  for (const msg of msgs) {
    // If this is a real message replacing a temp one, it wins
    if (!map.has(msg.id)) {
      map.set(msg.id, msg);
    }
  }
  return Array.from(map.values());
}

const MAX_POPUPS = 3;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatPopup() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [activeChats, setActiveChats] = useState<ChatPopupState[]>([]);

  // Per-popup message input state (keyed by conversationId)
  const [inputTexts, setInputTexts] = useState<Record<string, string>>({});
  const [inputAttachments, setInputAttachments] = useState<
    Record<string, File[]>
  >({});
  const [sendingMap, setSendingMap] = useState<Record<string, boolean>>({});

  // Typing indicators per conversation
  const [typingUsers, setTypingUsers] = useState<Record<string, string | null>>(
    {}
  );
  const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );

  // Socket
  const socketJoinedRef = useRef(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const messagesEndRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const activeChatsRef = useRef<ChatPopupState[]>([]);

  // Keep ref in sync
  useEffect(() => {
    activeChatsRef.current = activeChats;
  }, [activeChats]);

  // ---- Scroll to bottom for a conversation ----
  const scrollToBottom = useCallback((convId: string) => {
    setTimeout(() => {
      messagesEndRefs.current[convId]?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  // ---- Fetch messages for a conversation ----
  const fetchMessages = useCallback(
    async (convId: string) => {
      setActiveChats((prev) =>
        prev.map((c) =>
          c.conversationId === convId ? { ...c, loadingMessages: true } : c
        )
      );
      try {
        const { data } = await axios.get(
          `/api/chat/conversations/${convId}/messages`
        );
        setActiveChats((prev) =>
          prev.map((c) =>
            c.conversationId === convId
              ? {
                  ...c,
                  messages: deduplicateMessages(data.messages),
                  loadingMessages: false,
                  unreadCount: 0,
                }
              : c
          )
        );
        scrollToBottom(convId);
      } catch {
        setActiveChats((prev) =>
          prev.map((c) =>
            c.conversationId === convId
              ? { ...c, loadingMessages: false }
              : c
          )
        );
      }
    },
    [scrollToBottom]
  );

  // ---- Open or focus a chat popup ----
  const openChatPopup = useCallback(
    (
      conversationId: string,
      otherUser: { id: string; name: string },
      conversation: Conversation | null,
      expand: boolean
    ) => {
      setActiveChats((prev) => {
        const existing = prev.find(
          (c) => c.conversationId === conversationId
        );
        if (existing) {
          return prev.map((c) =>
            c.conversationId === conversationId
              ? { ...c, isExpanded: expand, flash: false, unreadCount: 0 }
              : c
          );
        }
        // Add new popup, cap at MAX_POPUPS (remove oldest)
        const newPopup: ChatPopupState = {
          conversationId,
          otherUser,
          isExpanded: expand,
          messages: [],
          unreadCount: 0,
          conversation,
          loadingMessages: false,
          flash: false,
        };
        const updated = [...prev, newPopup];
        if (updated.length > MAX_POPUPS) {
          updated.shift();
        }
        return updated;
      });

      // Join conversation room
      const socket = getSocket();
      socket.emit("join-conversation", conversationId);

      // Fetch messages
      if (expand) {
        // Small delay to let state update
        setTimeout(() => fetchMessages(conversationId), 50);
      }
    },
    [fetchMessages]
  );

  // ---- Socket setup ----
  useEffect(() => {
    if (!currentUserId) return;

    const socket = getSocket();

    // Join user room (re-join if userId changes or socket reconnects)
    socket.emit("join", currentUserId);
    socketJoinedRef.current = true;
    console.log("[ChatPopup] Joined user room:", currentUserId);

    socket.on("connect", () => {
      // Re-join on reconnect
      socket.emit("join", currentUserId);
      console.log("[ChatPopup] Re-joined user room after reconnect:", currentUserId);
    });

    const handleNotification = (data: any) => {
      // Don't handle our own messages via notification (we add them optimistically)
      if (data.senderId === currentUserId) return;

      const currentChats = activeChatsRef.current;
      const existingChat = currentChats.find(
        (c) => c.conversationId === data.conversationId
      );

      if (existingChat) {
        // Chat popup already exists
        const newMsg: ChatMessage = {
          id: data.messageId,
          body: data.body,
          senderId: data.senderId,
          sender: { id: data.senderId, name: data.senderName },
          createdAt: data.createdAt,
          attachments: data.attachments || [],
        };

        setActiveChats((prev) =>
          prev.map((c) => {
            if (c.conversationId !== data.conversationId) return c;
            // Deduplicate
            if (c.messages.some((m) => m.id === data.messageId)) return c;
            return {
              ...c,
              messages: deduplicateMessages([...c.messages, newMsg]),
              unreadCount: c.isExpanded ? 0 : c.unreadCount + 1,
              flash: !c.isExpanded, // flash if minimized
            };
          })
        );
        scrollToBottom(data.conversationId);
      } else {
        // New incoming message - create a bar popup
        openChatPopup(
          data.conversationId,
          { id: data.senderId, name: data.senderName },
          null,
          false // minimized bar
        );
        // Add the message
        const newMsg: ChatMessage = {
          id: data.messageId,
          body: data.body,
          senderId: data.senderId,
          sender: { id: data.senderId, name: data.senderName },
          createdAt: data.createdAt,
          attachments: data.attachments || [],
        };
        // Use setTimeout to ensure popup was created first
        setTimeout(() => {
          setActiveChats((prev) =>
            prev.map((c) =>
              c.conversationId === data.conversationId
                ? {
                    ...c,
                    messages: deduplicateMessages([...c.messages, newMsg]),
                    unreadCount: 1,
                    flash: true,
                  }
                : c
            )
          );
        }, 100);
      }
    };

    const handleNewMessage = (data: any) => {
      // For messages received on the conversation room channel
      if (data.senderId === currentUserId) return;

      const currentChats = activeChatsRef.current;
      const existingChat = currentChats.find(
        (c) => c.conversationId === data.conversationId
      );

      if (existingChat) {
        const newMsg: ChatMessage = {
          id: data.messageId,
          body: data.body,
          senderId: data.senderId,
          sender: { id: data.senderId, name: data.senderName },
          createdAt: data.createdAt,
          attachments: data.attachments || [],
        };
        setActiveChats((prev) =>
          prev.map((c) => {
            if (c.conversationId !== data.conversationId) return c;
            if (c.messages.some((m) => m.id === data.messageId)) return c;
            return {
              ...c,
              messages: deduplicateMessages([...c.messages, newMsg]),
              unreadCount: c.isExpanded ? 0 : c.unreadCount + 1,
              flash: !c.isExpanded,
            };
          })
        );
        scrollToBottom(data.conversationId);
      }
    };

    const handleTyping = (data: any) => {
      setTypingUsers((prev) => ({
        ...prev,
        [data.conversationId]: data.userName,
      }));
    };

    const handleStopTyping = (data: any) => {
      setTypingUsers((prev) => ({
        ...prev,
        [data.conversationId]: null,
      }));
    };

    socket.on("chat-notification", handleNotification);
    socket.on("new-message", handleNewMessage);
    socket.on("user-typing", handleTyping);
    socket.on("user-stop-typing", handleStopTyping);

    return () => {
      socket.off("chat-notification", handleNotification);
      socket.off("new-message", handleNewMessage);
      socket.off("user-typing", handleTyping);
      socket.off("user-stop-typing", handleStopTyping);
    };
  }, [currentUserId, scrollToBottom, openChatPopup]);

  // ---- Expand a chat bar ----
  const expandChat = useCallback(
    (convId: string) => {
      setActiveChats((prev) =>
        prev.map((c) =>
          c.conversationId === convId
            ? { ...c, isExpanded: true, flash: false, unreadCount: 0 }
            : c
        )
      );
      fetchMessages(convId);
    },
    [fetchMessages]
  );

  // ---- Minimize (collapse) a chat ----
  const minimizeChat = useCallback((convId: string) => {
    setActiveChats((prev) =>
      prev.map((c) =>
        c.conversationId === convId ? { ...c, isExpanded: false } : c
      )
    );
  }, []);

  // ---- Close (remove) a chat popup ----
  const closeChat = useCallback((convId: string) => {
    const socket = getSocket();
    socket.emit("leave-conversation", convId);
    setActiveChats((prev) =>
      prev.filter((c) => c.conversationId !== convId)
    );
    // Clean up input state
    setInputTexts((prev) => {
      const copy = { ...prev };
      delete copy[convId];
      return copy;
    });
    setInputAttachments((prev) => {
      const copy = { ...prev };
      delete copy[convId];
      return copy;
    });
  }, []);

  // ---- Send message ----
  const handleSend = useCallback(
    async (convId: string) => {
      const body = (inputTexts[convId] || "").trim();
      const files = inputAttachments[convId] || [];
      if (!body && files.length === 0) return;

      setSendingMap((prev) => ({ ...prev, [convId]: true }));

      const optimisticId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticMsg: ChatMessage = {
        id: optimisticId,
        body,
        senderId: currentUserId!,
        sender: { id: currentUserId!, name: session?.user?.name || "You" },
        createdAt: new Date().toISOString(),
        attachments: [],
      };

      setActiveChats((prev) =>
        prev.map((c) =>
          c.conversationId === convId
            ? { ...c, messages: [...c.messages, optimisticMsg] }
            : c
        )
      );
      setInputTexts((prev) => ({ ...prev, [convId]: "" }));
      scrollToBottom(convId);

      try {
        const formData = new FormData();
        formData.append("body", body);
        files.forEach((file) => formData.append("attachments", file));

        const { data } = await axios.post(
          `/api/chat/conversations/${convId}/messages`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        // Replace optimistic message with real one
        setActiveChats((prev) =>
          prev.map((c) =>
            c.conversationId === convId
              ? {
                  ...c,
                  messages: deduplicateMessages(
                    c.messages.map((m) =>
                      m.id === optimisticId ? data.message : m
                    )
                  ),
                }
              : c
          )
        );
        setInputAttachments((prev) => ({ ...prev, [convId]: [] }));
        scrollToBottom(convId);

        // Emit via socket
        const socket = getSocket();
        const chat = activeChatsRef.current.find(
          (c) => c.conversationId === convId
        );
        const otherParticipants = chat?.conversation?.participants
          .filter((p) => p.userId !== currentUserId)
          .map((p) => p.userId) || [chat?.otherUser.id].filter(Boolean);

        socket.emit("send-message", {
          conversationId: convId,
          messageId: data.message.id,
          senderId: currentUserId,
          senderName: session?.user?.name,
          body,
          createdAt: data.message.createdAt,
          attachments: data.message.attachments,
          recipientIds: otherParticipants,
        });
      } catch {
        // Remove optimistic message on failure
        setActiveChats((prev) =>
          prev.map((c) =>
            c.conversationId === convId
              ? {
                  ...c,
                  messages: c.messages.filter((m) => m.id !== optimisticId),
                }
              : c
          )
        );
        setInputTexts((prev) => ({ ...prev, [convId]: body }));
      } finally {
        setSendingMap((prev) => ({ ...prev, [convId]: false }));
      }
    },
    [currentUserId, session, inputTexts, inputAttachments, scrollToBottom]
  );

  // ---- Typing events ----
  const handleTypingEvent = useCallback(
    (convId: string) => {
      if (!currentUserId) return;
      const socket = getSocket();
      socket.emit("typing", {
        conversationId: convId,
        userId: currentUserId,
        userName: session?.user?.name || "Someone",
      });
      if (typingTimersRef.current[convId]) {
        clearTimeout(typingTimersRef.current[convId]);
      }
      typingTimersRef.current[convId] = setTimeout(() => {
        socket.emit("stop-typing", {
          conversationId: convId,
          userId: currentUserId,
        });
      }, 2000);
    },
    [currentUserId, session]
  );

  if (!currentUserId) return null;

  // Nothing to render if no active chats
  if (activeChats.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-6 z-50 flex items-end gap-2">
      {activeChats.map((chat) => {
        const sending = sendingMap[chat.conversationId] || false;
        const messageText = inputTexts[chat.conversationId] || "";
        const attachments = inputAttachments[chat.conversationId] || [];
        const typing = typingUsers[chat.conversationId];
        const lastMsg =
          chat.messages.length > 0
            ? chat.messages[chat.messages.length - 1]
            : null;
        const previewText = lastMsg
          ? lastMsg.body.length > 30
            ? lastMsg.body.slice(0, 30) + "..."
            : lastMsg.body
          : "New conversation";

        if (!chat.isExpanded) {
          // ---- Minimized bar ----
          return (
            <div
              key={chat.conversationId}
              className={`flex items-center gap-2 rounded-t-lg bg-[#00968a] px-3 py-2.5 text-white shadow-lg cursor-pointer select-none transition-all ${
                chat.flash ? "animate-pulse" : ""
              }`}
              style={{ width: 280, height: 44 }}
              onClick={() => expandChat(chat.conversationId)}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
                <span className="text-xs font-medium">
                  {chat.otherUser.name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold truncate">
                    {chat.otherUser.name}
                  </span>
                  {chat.unreadCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
                <p className="truncate text-[10px] text-white/70">
                  {previewText}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeChat(chat.conversationId);
                }}
                className="shrink-0 rounded p-0.5 hover:bg-white/20"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        }

        // ---- Expanded chat window ----
        return (
          <div
            key={chat.conversationId}
            className="flex flex-col overflow-hidden rounded-t-lg border bg-white shadow-2xl"
            style={{ width: 340, height: 480 }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between bg-[#00968a] px-3 py-2.5 text-white">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <span className="text-xs font-medium">
                    {chat.otherUser.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">
                    {chat.otherUser.name}
                  </p>
                  {typing && (
                    <p className="text-[10px] text-white/70 italic animate-pulse">
                      typing...
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => minimizeChat(chat.conversationId)}
                  className="rounded p-1 hover:bg-white/20"
                  title="Minimize"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => closeChat(chat.conversationId)}
                  className="rounded p-1 hover:bg-white/20"
                  title="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {chat.loadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-[#00968a]" />
                </div>
              ) : chat.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <p className="text-xs text-muted-foreground">
                    No messages yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {deduplicateMessages(chat.messages).map((msg) => {
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
                              ? "rounded-br-sm bg-[#00968a] text-white"
                              : "rounded-bl-sm bg-gray-100"
                          }`}
                        >
                          <p
                            className={`text-xs leading-relaxed whitespace-pre-wrap ${
                              isOwn ? "text-white/95" : "text-gray-900"
                            }`}
                          >
                            {msg.body}
                          </p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {msg.attachments.map((att) => (
                                <div
                                  key={att.id}
                                  className={`inline-flex items-center gap-1 px-2 py-1 border rounded text-[10px] ${
                                    isOwn
                                      ? "bg-white/20 border-white/30 text-white"
                                      : "bg-white/80 border-gray-200"
                                  }`}
                                >
                                  <FileText className="h-3 w-3" />
                                  <span className="max-w-[80px] truncate">
                                    {att.fileName}
                                  </span>
                                  <a
                                    href={`/api/attachments/${att.id}`}
                                    download={att.fileName}
                                    className={`p-0.5 rounded hover:bg-black/10 ${
                                      isOwn ? "text-white/70" : "text-gray-500"
                                    }`}
                                    title="Download"
                                  >
                                    <Download className="h-2.5 w-2.5" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                          <p
                            className={`mt-1 text-[9px] ${
                              isOwn
                                ? "text-white/50"
                                : "text-gray-400"
                            }`}
                          >
                            {timeAgo(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div
                    ref={(el) => {
                      messagesEndRefs.current[chat.conversationId] = el;
                    }}
                  />
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
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-[10px]"
                    >
                      <Paperclip className="h-2.5 w-2.5" />
                      <span className="max-w-[80px] truncate">{file.name}</span>
                      <button
                        onClick={() =>
                          setInputAttachments((prev) => ({
                            ...prev,
                            [chat.conversationId]: (
                              prev[chat.conversationId] || []
                            ).filter((_, idx) => idx !== i),
                          }))
                        }
                        className="text-gray-400 hover:text-red-500 ml-0.5"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <button
                  onClick={() =>
                    fileInputRefs.current[chat.conversationId]?.click()
                  }
                  className="shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  ref={(el) => {
                    fileInputRefs.current[chat.conversationId] = el;
                  }}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.csv"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setInputAttachments((prev) => ({
                        ...prev,
                        [chat.conversationId]: [
                          ...(prev[chat.conversationId] || []),
                          ...Array.from(e.target.files!),
                        ],
                      }));
                      e.target.value = "";
                    }
                  }}
                />
                <textarea
                  value={messageText}
                  onChange={(e) => {
                    setInputTexts((prev) => ({
                      ...prev,
                      [chat.conversationId]: e.target.value,
                    }));
                    handleTypingEvent(chat.conversationId);
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 resize-none rounded-lg border bg-white px-3 py-2 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00968a]/30"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(chat.conversationId);
                    }
                  }}
                />
                <button
                  onClick={() => handleSend(chat.conversationId)}
                  disabled={sending || (!messageText.trim() && attachments.length === 0)}
                  className="shrink-0 rounded-lg bg-[#00968a] p-2 text-white disabled:opacity-50 hover:bg-[#007d73] transition-colors"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
