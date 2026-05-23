"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Mail,
  Send,
  Sparkles,
  Loader2,
  Inbox,
  ArrowUpDown,
  FileText,
  Paperclip,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Plus,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmailAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

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
  isRead: boolean;
  isReplied: boolean;
  aiImportance: number | null;
  createdAt: string;
  repliedAt: string | null;
  clientId: string | null;
  userId: string | null;
  attachments?: EmailAttachment[];
  client?: { name: string } | null;
  user?: { name: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type Filter = "all" | "unread" | "read" | "unreplied" | "replied" | "ordered";

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
  return dept ? map[dept] || dept : "Firm-Wide";
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
        <div
          key={i}
          className="animate-pulse space-y-2 rounded-lg bg-muted/60 p-4"
        >
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
            i % 2 === 0 ? "mr-16 bg-muted/60" : "ml-16 bg-brand-200/60 dark:bg-brand-800/40"
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
  const { data: session } = useSession();
  const dept = session?.user?.department || null;
  const deptDisplayName = getDeptName(dept);

  const [emails, setEmails] = useState<Email[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thread, setThread] = useState<Email[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [replyText, setReplyText] = useState("");
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [prioritizing, setPrioritizing] = useState(false);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compose state
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeAttachments, setComposeAttachments] = useState<File[]>([]);
  const [sendingCompose, setSendingCompose] = useState(false);
  const composeFileRef = useRef<HTMLInputElement>(null);

  // ---- Fetch email list ----
  const fetchEmails = useCallback(
    async (page = 1) => {
      setLoadingEmails(true);
      try {
        // "ordered" uses the stored orderedIds to sort, fetches unread from API
        const apiFilter = filter === "ordered" ? "unread" : filter;
        const params: Record<string, string> = {
          filter: apiFilter,
          page: String(page),
          limit: "50", // fetch more for ordered view
        };
        if (search.trim()) params.search = search;

        const { data } = await axios.get("/api/emails", { params });
        let resultEmails = data.emails;

        // If ordered view, sort by the AI-ordered IDs
        if (filter === "ordered" && orderedIds.length > 0) {
          const idOrder = new Map(orderedIds.map((id, i) => [id, i]));
          resultEmails = [...resultEmails].sort((a: Email, b: Email) => {
            const posA = idOrder.get(a.id) ?? 999;
            const posB = idOrder.get(b.id) ?? 999;
            return posA - posB;
          });
        }

        setEmails(resultEmails);
        setPagination(data.pagination);
      } catch {
        toast.error("Failed to load emails");
      } finally {
        setLoadingEmails(false);
      }
    },
    [filter, search, orderedIds]
  );

  useEffect(() => {
    fetchEmails(1);
  }, [fetchEmails]);

  // ---- Debounced search ----
  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearch(value);
    }, 400);
  };

  // ---- Poll Gmail for new emails every 10 seconds ----
  useEffect(() => {
    const poll = async () => {
      try {
        const { data } = await axios.post("/api/emails/poll");
        if (data.fetched > 0) {
          toast.success(`${data.fetched} new email(s) received`);
          fetchEmails(pagination.page);
        }
      } catch {
        // silent fail
      }
    };
    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [fetchEmails, pagination.page]);

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
        if (!cancelled) {
          setThread(data);
          // Update the email in the list to show as read (without refetching)
          setEmails((prev) =>
            prev.map((e) =>
              e.threadId ===
              (data.length > 0 ? data[0].threadId : "")
                ? { ...e, isRead: true }
                : e
            )
          );
        }
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
      attachments.forEach((file) => formData.append("attachments", file));

      await axios.post(`/api/emails/${selectedId}/reply`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Reply sent");
      setReplyText("");
      setAttachments([]);
      // Refresh thread
      const { data } = await axios.get<Email[]>(`/api/emails/${selectedId}`);
      setThread(data);
      fetchEmails(pagination.page);
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  // ---- AI Enhance Reply ----
  const handleEnhance = async () => {
    if (!replyText.trim() || !selectedId) return;
    setEnhancing(true);
    try {
      const { data } = await axios.post(`/api/emails/${selectedId}/enhance`, {
        draft: replyText,
      });
      setReplyText(data.enhanced);
      toast.success("Reply enhanced by AI");
    } catch {
      toast.error("AI Assist failed");
    } finally {
      setEnhancing(false);
    }
  };

  // ---- AI Prioritize ----
  const handlePrioritize = async () => {
    setPrioritizing(true);
    try {
      const { data } = await axios.post("/api/emails/prioritize");
      setOrderedIds(data.orderedIds || []);
      toast.success("AI has ordered your emails by importance");
      setFilter("ordered");
    } catch {
      toast.error("AI prioritization failed");
    } finally {
      setPrioritizing(false);
    }
  };

  // ---- Compose & send new email ----
  const handleComposeSend = async () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) return;
    setSendingCompose(true);
    try {
      const formData = new FormData();
      formData.append("to", composeTo.trim());
      formData.append("subject", composeSubject.trim());
      formData.append("body", composeBody.trim());
      composeAttachments.forEach((file) => formData.append("attachments", file));

      await axios.post("/api/emails/compose", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Email sent successfully");
      setShowCompose(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setComposeAttachments([]);
      fetchEmails(pagination.page);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to send email");
    } finally {
      setSendingCompose(false);
    }
  };

  // ---- Pagination handlers ----
  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchEmails(page);
  };

  // ---- Selected email (for detail header) ----
  const selectedEmail = emails.find((e) => e.id === selectedId) ?? null;

  // ---- Render ----
  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col gap-4">
      {/* ------ Header ------ */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-brand-700 dark:text-brand-400">
            Emails
          </h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {deptDisplayName} inbox
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button
            onClick={() => setShowCompose(true)}
            className="gap-2 bg-brand-600 text-white hover:bg-brand-700 flex-1 md:flex-none"
          >
            <Plus className="h-4 w-4" />
            Compose
          </Button>
          <Button
            variant="outline"
            onClick={handlePrioritize}
            disabled={prioritizing}
            className="gap-2 flex-1 md:flex-none"
          >
            {prioritizing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            )}
            {prioritizing ? "Analyzing..." : "Sort by Importance"}
          </Button>
        </div>
      </div>

      {/* ------ Filter tabs + Search + AI prioritize ------ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap gap-1 rounded-full border border-border bg-muted/50 p-1">
          {(["all", "unread", "read", "unreplied", "replied", ...(orderedIds.length > 0 ? ["ordered" as const] : [])] as const).map((f) => {
            const isActive = filter === f;
            const label =
              f === "unreplied"
                ? "Un-replied"
                : f === "ordered"
                ? "AI Ordered"
                : f.charAt(0).toUpperCase() + f.slice(1);
            return (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setFilter(f);
                  setSelectedId(null);
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search emails..."
              className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrioritize}
            disabled={prioritizing}
            className="gap-2"
          >
            {prioritizing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            )}
            {prioritizing ? "Analyzing..." : "Order by Important"}
          </Button>
        </div>
      </div>

      {/* ------ Main split layout - INDEPENDENT scrolling ------ */}
      <div className="flex flex-col md:flex-row flex-1 gap-4 min-h-0">
        {/* ====== LEFT: Email list ====== */}
        <Card className="flex w-full md:w-[40%] md:min-w-[320px] flex-col overflow-hidden min-h-[300px] md:min-h-0">
          {loadingEmails ? (
            <EmailListSkeleton />
          ) : emails.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Inbox className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {search ? "No emails match your search" : "No emails found"}
              </p>
            </div>
          ) : (
            <>
              {/* Scrollable email list */}
              <div className="flex-1 overflow-y-auto">
                {emails.map((email) => {
                  const isSelected = email.id === selectedId;
                  const isUnread = email.isIncoming && !email.isRead;
                  const importance = email.aiImportance ?? 0;
                  const needsReply = email.isIncoming && !email.isReplied;
                  const accentClass =
                    importance >= 70
                      ? "bg-red-500 dark:bg-red-400"
                      : needsReply
                      ? "bg-brand-500"
                      : "bg-transparent";

                  return (
                    <button
                      key={email.id}
                      onClick={() => setSelectedId(email.id)}
                      className={`group relative w-full border-b px-4 py-3.5 pl-5 text-left transition-colors last:border-b-0 ${
                        isSelected
                          ? "bg-brand-50/40 dark:bg-brand-950/30"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`pointer-events-none absolute left-1.5 top-2 bottom-2 w-[3px] rounded-full ${accentClass}`}
                      />
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
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
                          <p
                            className={`mt-0.5 truncate text-sm ${
                              isUnread
                                ? "font-medium text-foreground"
                                : "text-foreground/70"
                            }`}
                          >
                            {email.subject}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {email.body.slice(0, 80)}
                            {email.body.length > 80 ? "..." : ""}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${
                              email.isReplied
                                ? "bg-emerald-500"
                                : isUnread
                                ? "bg-red-400"
                                : "bg-muted-foreground/40"
                            }`}
                            title={
                              email.isReplied
                                ? "Replied"
                                : isUnread
                                ? "Unread"
                                : "Read"
                            }
                          />
                          {importance > 50 && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight ${
                                importance > 70
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
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

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-2.5">
                  <span className="text-xs text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => goToPage(pagination.page - 1)}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => goToPage(pagination.page + 1)}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        {/* ====== RIGHT: Email detail & thread (INDEPENDENT scroll) ====== */}
        <Card className={`flex flex-1 flex-col overflow-hidden min-h-[400px] md:min-h-0 ${!selectedId ? "hidden md:flex" : ""}`}>
          {!selectedId ? (
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
                <div className="shrink-0 border-b px-4 md:px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="md:hidden mb-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                  <h2 className="text-lg font-semibold leading-tight break-words">
                    {selectedEmail.subject}
                  </h2>
                  <div className="mt-1.5 flex flex-wrap md:flex-nowrap items-center gap-3 text-sm text-muted-foreground">
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
                                ? "text-red-600 dark:text-red-400"
                                : "text-amber-600 dark:text-amber-400"
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

              {/* Thread messages - scrollable independently */}
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
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
                                ? "rounded-br-md bg-brand-600 text-white"
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
                            {msg.attachments &&
                              msg.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {msg.attachments.map((att) => (
                                    <a
                                      key={att.id}
                                      href={`/api/attachments/${att.id}`}
                                      target="_blank"
                                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs transition-colors ${
                                        isOutgoing
                                          ? "bg-white/20 border-white/30 text-white hover:bg-white/30"
                                          : "bg-card/80 border-border hover:bg-muted"
                                      }`}
                                    >
                                      {getFileIcon(att.mimeType)}
                                      <span className="max-w-[150px] truncate">
                                        {att.fileName}
                                      </span>
                                      <span
                                        className={
                                          isOutgoing
                                            ? "text-white/50"
                                            : "text-muted-foreground"
                                        }
                                      >
                                        ({formatFileSize(att.fileSize)})
                                      </span>
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

              {/* Reply box - fixed at bottom */}
              <div className="shrink-0 border-t bg-muted/20 px-4 md:px-6 py-4">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                  rows={5}
                  className="w-full resize-y min-h-[120px] rounded-xl border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleReply();
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
                      setAttachments((prev) => [
                        ...prev,
                        ...Array.from(e.target.files!),
                      ]);
                      e.target.value = "";
                    }
                  }}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 md:flex-nowrap md:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 rounded-xl text-sm"
                  >
                    <Paperclip className="h-4 w-4" />
                    Attach
                  </Button>
                  <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
                    <button
                      type="button"
                      onClick={handleEnhance}
                      disabled={enhancing || !replyText.trim()}
                      className="inline-flex items-center gap-1.5 rounded-full border border-brand-200/60 dark:border-brand-800/50 bg-brand-50 dark:bg-brand-950/40 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {enhancing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      {enhancing ? "Enhancing..." : "AI Assist"}
                    </button>
                    <Button
                      onClick={handleReply}
                      disabled={sendingReply || !replyText.trim()}
                      className="gap-2 rounded-xl bg-brand-600 px-5 py-3 text-white hover:bg-brand-700"
                    >
                      {sendingReply ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {sendingReply ? "Sending..." : "Send Reply"}
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

      {/* ====== Compose Modal ====== */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky header */}
            <div className="flex items-center justify-between p-6 pb-3 shrink-0 border-b">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Mail className="h-5 w-5 text-brand-600" />
                New Email
              </h2>
              <button
                onClick={() => setShowCompose(false)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto p-6 pt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground/80 mb-1 block">
                  To *
                </label>
                <Input
                  type="email"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="recipient@example.com"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground/80 mb-1 block">
                  Subject *
                </label>
                <Input
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Email subject..."
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground/80 mb-1 block">
                  Message *
                </label>
                <Textarea
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Write your email..."
                  rows={8}
                  className="resize-y min-h-[160px]"
                />
              </div>

              {/* Attachments */}
              <div>
                <input
                  ref={composeFileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setComposeAttachments((prev) => [
                        ...prev,
                        ...Array.from(e.target.files!),
                      ]);
                      e.target.value = "";
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => composeFileRef.current?.click()}
                  className="gap-2"
                >
                  <Paperclip className="h-4 w-4" />
                  {composeAttachments.length > 0
                    ? `${composeAttachments.length} file(s) attached`
                    : "Attach Files"}
                </Button>
                {composeAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {composeAttachments.map((file, i) => (
                      <div
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-muted rounded-lg text-xs"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span className="max-w-[150px] truncate font-medium">
                          {file.name}
                        </span>
                        <button
                          onClick={() =>
                            setComposeAttachments((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                          className="text-muted-foreground hover:text-red-500 ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-2 p-6 pt-3 border-t shrink-0">
              <Button
                variant="outline"
                onClick={() => setShowCompose(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleComposeSend}
                disabled={
                  sendingCompose ||
                  !composeTo.trim() ||
                  !composeSubject.trim() ||
                  !composeBody.trim()
                }
                className="gap-2 bg-brand-600 text-white hover:bg-brand-700"
              >
                {sendingCompose ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {sendingCompose ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
