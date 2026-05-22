"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Mail,
  Send,
  Sparkles,
  Loader2,
  Inbox,
  ArrowUpDown,
  FileText,
  Paperclip,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Email {
  id: string;
  threadId: string;
  parentId: string | null;
  senderEmail: string;
  senderName: string;
  recipientDept: string;
  subject: string;
  body: string;
  isIncoming: boolean;
  isReplied: boolean;
  aiImportance: number | null;
  createdAt: string;
  repliedAt: string | null;
  clientId: string | null;
  userId: string | null;
  client?: { name: string } | null;
  user?: { name: string } | null;
}

type Filter = "all" | "unread" | "replied";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFileIcon(mimeType: string) {
  if (mimeType === "application/pdf") return <FileText className="h-3.5 w-3.5 text-red-500" />;
  if (mimeType.includes("word")) return <FileText className="h-3.5 w-3.5 text-blue-500" />;
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return <FileText className="h-3.5 w-3.5 text-green-500" />;
  return <FileText className="h-3.5 w-3.5 text-gray-500" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
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

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function EmailListSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-2 rounded-lg bg-muted/60 p-4">
          <div className="h-3.5 w-1/3 rounded bg-muted-foreground/20" />
          <div className="h-3 w-2/3 rounded bg-muted-foreground/15" />
          <div className="h-2.5 w-full rounded bg-muted-foreground/10" />
        </div>
      ))}
    </div>
  );
}

function ThreadSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-xl p-4 ${
            i % 2 === 0 ? "mr-16 bg-muted/60" : "ml-16 bg-[#00968a]/20"
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
// Main component
// ---------------------------------------------------------------------------

export default function HREmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thread, setThread] = useState<Email[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [replyText, setReplyText] = useState("");
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [prioritizing, setPrioritizing] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Fetch email list ----
  const fetchEmails = useCallback(async () => {
    setLoadingEmails(true);
    try {
      const params: Record<string, string> = {};
      if (filter === "unread") params.unread = "true";
      const { data } = await axios.get<Email[]>("/api/emails", { params });
      let filtered = data;
      if (filter === "replied") {
        filtered = data.filter((e) => e.isReplied);
      }
      setEmails(filtered);
    } catch {
      toast.error("Failed to load emails");
    } finally {
      setLoadingEmails(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // ---- Fetch thread when selection changes ----
  useEffect(() => {
    if (!selectedId) {
      setThread([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingThread(true);
      try {
        const { data } = await axios.get<Email[]>(`/api/emails/${selectedId}`);
        if (!cancelled) setThread(data);
      } catch {
        toast.error("Failed to load email thread");
      } finally {
        if (!cancelled) setLoadingThread(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // ---- Send reply ----
  const handleReply = async () => {
    if (!replyText.trim() || !selectedId) return;
    setSendingReply(true);
    try {
      const formData = new FormData();
      formData.append("body", replyText);
      attachments.forEach(file => formData.append("attachments", file));

      await axios.post(`/api/emails/${selectedId}/reply`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Reply sent");
      setReplyText("");
      setAttachments([]);
      // Refresh thread
      const { data } = await axios.get<Email[]>(`/api/emails/${selectedId}`);
      setThread(data);
      // Refresh list to update reply status
      fetchEmails();
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  // ---- AI Prioritize ----
  const handlePrioritize = async () => {
    setPrioritizing(true);
    try {
      await axios.post("/api/emails/prioritize");
      toast.success("Emails prioritized by AI");
      const { data } = await axios.get<Email[]>("/api/emails");
      const sorted = [...data].sort(
        (a, b) => (b.aiImportance ?? 0) - (a.aiImportance ?? 0)
      );
      setEmails(
        filter === "replied"
          ? sorted.filter((e) => e.isReplied)
          : filter === "unread"
          ? sorted.filter((e) => !e.isReplied && e.isIncoming)
          : sorted
      );
    } catch {
      toast.error("AI prioritization failed");
    } finally {
      setPrioritizing(false);
    }
  };

  // ---- Selected email (for detail header) ----
  const selectedEmail = emails.find((e) => e.id === selectedId) ?? null;

  // ---- Render ----
  return (
    <div className="flex h-full flex-col gap-4">
      {/* ------ Header ------ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00968a]/10">
            <Mail className="h-5 w-5 text-[#00968a]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">HR Emails</h1>
            <p className="text-sm text-muted-foreground">
              {emails.length} email{emails.length !== 1 ? "s" : ""}
              {filter !== "all" ? ` (${filter})` : ""}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handlePrioritize}
          disabled={prioritizing}
          className="gap-2"
        >
          {prioritizing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 text-[#00968a]" />
          )}
          {prioritizing ? "Analyzing..." : "Order by Important"}
        </Button>
      </div>

      {/* ------ Filter tabs ------ */}
      <div className="flex gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
        {(["all", "unread", "replied"] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setSelectedId(null);
            }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              filter === f
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : f === "unread" ? "Unread" : "Replied"}
          </button>
        ))}
      </div>

      {/* ------ Main split layout ------ */}
      <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
        {/* ====== LEFT: Email list ====== */}
        <Card className="flex w-[40%] min-w-[320px] flex-col overflow-hidden">
          {loadingEmails ? (
            <EmailListSkeleton />
          ) : emails.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Inbox className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No emails found
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {emails.map((email) => {
                const isSelected = email.id === selectedId;
                const isUnread = email.isIncoming && !email.isReplied;
                const importance = email.aiImportance ?? 0;

                return (
                  <button
                    key={email.id}
                    onClick={() => setSelectedId(email.id)}
                    className={`group relative w-full border-b px-4 py-3.5 text-left transition-colors last:border-b-0 ${
                      isSelected
                        ? "bg-[#00968a]/8 border-l-2 border-l-[#00968a]"
                        : "hover:bg-muted/50 border-l-2 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {/* Sender + time */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`truncate text-sm ${
                              isUnread
                                ? "font-semibold text-foreground"
                                : "font-medium text-foreground/80"
                            }`}
                          >
                            {email.senderName}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {timeAgo(email.createdAt)}
                          </span>
                        </div>

                        {/* Subject */}
                        <p
                          className={`mt-0.5 truncate text-sm ${
                            isUnread
                              ? "font-medium text-foreground"
                              : "text-foreground/70"
                          }`}
                        >
                          {email.subject}
                        </p>

                        {/* Body preview */}
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {email.body.slice(0, 80)}
                          {email.body.length > 80 ? "..." : ""}
                        </p>
                      </div>

                      {/* Right-side indicators */}
                      <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
                        {/* Reply status dot */}
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            email.isReplied ? "bg-emerald-500" : "bg-red-400"
                          }`}
                          title={email.isReplied ? "Replied" : "Not replied"}
                        />
                        {/* AI importance badge */}
                        {importance > 50 && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight ${
                              importance > 70
                                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                            }`}
                          >
                            {importance > 70 ? "Urgent" : "Important"}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* ====== RIGHT: Email detail & thread ====== */}
        <Card className="flex flex-1 flex-col overflow-hidden">
          {!selectedId ? (
            /* Empty state */
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Mail className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <p className="font-medium text-muted-foreground">
                Select an email to view
              </p>
              <p className="text-sm text-muted-foreground/60">
                Choose an email from the list to see the full conversation
              </p>
            </div>
          ) : (
            <>
              {/* Detail header */}
              {selectedEmail && (
                <div className="border-b px-6 py-4">
                  <h2 className="text-lg font-semibold leading-tight">
                    {selectedEmail.subject}
                  </h2>
                  <div className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground">
                    <span>From: {selectedEmail.senderName}</span>
                    <span className="text-muted-foreground/40">|</span>
                    <span>{selectedEmail.senderEmail}</span>
                    {selectedEmail.aiImportance != null &&
                      selectedEmail.aiImportance > 50 && (
                        <>
                          <span className="text-muted-foreground/40">|</span>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              selectedEmail.aiImportance > 70
                                ? "text-red-600"
                                : "text-amber-600"
                            }`}
                          >
                            <ArrowUpDown className="h-3 w-3" />
                            Priority: {selectedEmail.aiImportance}%
                          </span>
                        </>
                      )}
                  </div>
                </div>
              )}

              {/* Thread messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {loadingThread ? (
                  <ThreadSkeleton />
                ) : thread.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">
                    No messages in thread
                  </p>
                ) : (
                  <div className="space-y-4">
                    {thread.map((msg) => {
                      const isOutgoing = !msg.isIncoming;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${
                            isOutgoing ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-5 py-3.5 ${
                              isOutgoing
                                ? "rounded-br-md bg-[#00968a] text-white"
                                : "rounded-bl-md bg-muted"
                            }`}
                          >
                            <div
                              className={`mb-1.5 flex items-center justify-between gap-4 text-xs ${
                                isOutgoing
                                  ? "text-white/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <span className="font-medium">
                                {isOutgoing
                                  ? msg.user?.name || msg.senderName
                                  : msg.senderName}
                              </span>
                              <span>{timeAgo(msg.createdAt)}</span>
                            </div>
                            <p
                              className={`text-sm leading-relaxed whitespace-pre-wrap ${
                                isOutgoing ? "text-white/95" : "text-foreground"
                              }`}
                            >
                              {msg.body}
                            </p>
                            {(msg as any).attachments && (msg as any).attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {(msg as any).attachments.map((att: any) => (
                                  <a
                                    key={att.id}
                                    href={`/api/attachments/${att.id}`}
                                    target="_blank"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border rounded-lg text-xs hover:bg-gray-50 transition-colors"
                                  >
                                    {getFileIcon(att.mimeType)}
                                    <span className="max-w-[150px] truncate">{att.fileName}</span>
                                    <span className="text-gray-400">({formatFileSize(att.fileSize)})</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reply box */}
              <div className="border-t bg-muted/20 px-6 py-4">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                  rows={3}
                  className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#00968a]/30 focus:border-[#00968a]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleReply();
                    }
                  }}
                />
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {attachments.map((file, i) => (
                      <div key={i} className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded text-xs">
                        <Paperclip className="h-3 w-3" />
                        <span className="max-w-[120px] truncate">{file.name}</span>
                        <button
                          onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-gray-400 hover:text-red-500 ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
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
                    Attach
                  </Button>
                  <Button
                    onClick={handleReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="gap-2 rounded-xl bg-[#00968a] px-5 py-3 text-white hover:bg-[#007d73]"
                  >
                    {sendingReply ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {sendingReply ? "Sending..." : "Send Reply"}
                  </Button>
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
