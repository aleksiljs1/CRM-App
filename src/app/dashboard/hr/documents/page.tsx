"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  File,
  Image as ImageIcon,
  CheckSquare,
  Mail,
  MessageSquare,
  Search,
  Download,
  Loader2,
  FolderOpen,
  FileSpreadsheet,
  Upload,
  Inbox,
  X,
  Trash2,
  Brain,
  Sparkles,
  Send,
  Paperclip,
  Wand2,
  Clock,
  MoreHorizontal,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface UnifiedDocument {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  source: "task" | "email" | "chat" | "manual";
  sourceLabel: string;
  sourceLink: string;
}

interface Counts {
  total: number;
  task: number;
  email: number;
  chat: number;
  manual: number;
}

interface QAEntry {
  question: string;
  answer: string;
}

type SourceFilter = "all" | "task" | "email" | "chat" | "manual";
type TypeFilter = "all" | "pdf" | "word" | "excel" | "image" | "other";

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function getFileType(
  mimeType: string,
  fileName: string
): "pdf" | "word" | "excel" | "image" | "other" {
  const mime = mimeType.toLowerCase();
  const name = fileName.toLowerCase();
  if (mime.includes("pdf")) return "pdf";
  if (
    mime.includes("word") ||
    mime.includes("msword") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx")
  )
    return "word";
  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".csv")
  )
    return "excel";
  if (mime.startsWith("image/")) return "image";
  return "other";
}

function isAICompatible(mimeType: string): boolean {
  return [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ].includes(mimeType);
}

const typeLabels: Record<string, string> = {
  pdf: "PDF",
  word: "Word",
  excel: "Excel",
  image: "Image",
  other: "Other",
};

const sourceChipLabels: Record<UnifiedDocument["source"], string> = {
  task: "From Task",
  email: "From Email",
  chat: "From Chat",
  manual: "Manual Upload",
};

const sourceChipClasses: Record<UnifiedDocument["source"], string> = {
  task: "bg-amber-100 text-amber-700 border border-amber-200/60 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800/50",
  email: "bg-emerald-100 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800/50",
  chat: "bg-violet-100 text-violet-700 border border-violet-200/60 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800/50",
  manual: "bg-brand-100/70 text-brand-700 border border-brand-200/60 dark:bg-brand-900/40 dark:text-brand-300 dark:border-brand-800/50",
};

/** Extract a probable uploader name from the unified sourceLabel. */
function uploaderFromLabel(doc: UnifiedDocument): string {
  const lbl = doc.sourceLabel || "";
  if (doc.source === "manual") {
    // "Uploaded by Jane Doe"
    return lbl.replace(/^Uploaded by\s+/i, "").trim() || "—";
  }
  if (doc.source === "email") {
    // "Email from Jane Doe: subject"
    const m = lbl.match(/^Email from\s+([^:]+):/i);
    if (m) return m[1].trim();
    return "Email";
  }
  if (doc.source === "chat") {
    // "Chat with Jane Doe"
    return lbl.replace(/^Chat with\s+/i, "").trim() || "Chat";
  }
  if (doc.source === "task") {
    // "Task: Title"
    return "Task";
  }
  return "—";
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function FileGlyph({
  type,
  className,
}: {
  type: "pdf" | "word" | "excel" | "image" | "other";
  className?: string;
}) {
  const cls = className || "size-4";
  switch (type) {
    case "pdf":
      return <FileText className={`${cls} text-red-500 dark:text-red-400`} />;
    case "word":
      return <FileText className={`${cls} text-blue-500 dark:text-blue-400`} />;
    case "excel":
      return <FileSpreadsheet className={`${cls} text-emerald-600 dark:text-emerald-400`} />;
    case "image":
      return <ImageIcon className={`${cls} text-violet-500 dark:text-violet-400`} />;
    default:
      return <File className={`${cls} text-muted-foreground`} />;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function HRDocumentsPage() {
  const { data: session } = useSession();
  const dept = session?.user?.department || null;
  const deptDisplayName = getDeptName(dept);

  const [documents, setDocuments] = useState<UnifiedDocument[]>([]);
  const [counts, setCounts] = useState<Counts>({
    total: 0,
    task: 0,
    email: 0,
    chat: 0,
    manual: 0,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [typeFilter] = useState<TypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processInputRef = useRef<HTMLInputElement>(null);

  // AI Modal state
  const [askModalDoc, setAskModalDoc] = useState<UnifiedDocument | null>(null);
  const [askQuestion, setAskQuestion] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [qaHistory, setQaHistory] = useState<QAEntry[]>([]);

  const [simplifyModalDoc, setSimplifyModalDoc] = useState<UnifiedDocument | null>(null);
  const [simplifyLoading, setSimplifyLoading] = useState(false);
  const [simplifySummary, setSimplifySummary] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocuments = useCallback(
    async (source: SourceFilter, search: string, type: TypeFilter) => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (source !== "all") params.source = source;
        if (search) params.search = search;
        if (type !== "all") params.type = type;

        const { data } = await axios.get("/api/documents", { params });
        setDocuments(data.documents);
        setCounts(data.counts);
      } catch (err: any) {
        console.error("Failed to fetch documents:", err?.response?.data || err?.message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchDocuments(sourceFilter, searchQuery, typeFilter);
  }, [sourceFilter, typeFilter, fetchDocuments]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchDocuments(sourceFilter, value, typeFilter);
    }, 400);
  };

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of Array.from(e.target.files)) {
        formData.append("files", file);
      }
      const { data } = await axios.post("/api/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`${data.count} document(s) uploaded`);
      fetchDocuments(sourceFilter, searchQuery, typeFilter);
    } catch {
      toast.error("Failed to upload documents");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (processInputRef.current) processInputRef.current.value = "";
    }
  }

  // Sorted client-side by most recent first; default selection follows the
  // top of the filtered list.
  const sorted = useMemo(
    () =>
      [...documents].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [documents]
  );

  // Keep selection in-sync with filtered list (pick first if current selection is gone).
  useEffect(() => {
    if (sorted.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !sorted.find((d) => d.id === selectedId)) {
      setSelectedId(sorted[0].id);
    }
  }, [sorted, selectedId]);

  const featuredDoc = sorted.find((d) => d.id === selectedId) || sorted[0] || null;

  // ─── Delete ───────────────────────────────────────────────────────────────
  async function handleDelete(doc: UnifiedDocument) {
    if (!window.confirm("Delete this document?")) return;
    setDeletingId(doc.id);
    try {
      await axios.delete(`/api/documents/${doc.id}`);
      toast.success("Document deleted");
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      setCounts((prev) => ({
        ...prev,
        total: prev.total - 1,
        [doc.source]: (prev as any)[doc.source] - 1,
      }));
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  }

  // ─── Ask AI ───────────────────────────────────────────────────────────────
  function openAskModal(doc: UnifiedDocument) {
    setAskModalDoc(doc);
    setAskQuestion("");
    setQaHistory([]);
  }

  async function handleAskSubmit() {
    if (!askModalDoc || !askQuestion.trim()) return;
    setAskLoading(true);
    try {
      const { data } = await axios.post(`/api/documents/${askModalDoc.id}/ask`, {
        question: askQuestion.trim(),
      });
      setQaHistory((prev) => [...prev, { question: askQuestion.trim(), answer: data.answer }]);
      setAskQuestion("");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to get AI answer");
    } finally {
      setAskLoading(false);
    }
  }

  // ─── Simplify ─────────────────────────────────────────────────────────────
  async function handleSimplify(doc: UnifiedDocument) {
    setSimplifyModalDoc(doc);
    setSimplifyLoading(true);
    setSimplifySummary("");
    try {
      const { data } = await axios.post(`/api/documents/${doc.id}/simplify`);
      setSimplifySummary(data.summary);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to simplify document");
      setSimplifyModalDoc(null);
    } finally {
      setSimplifyLoading(false);
    }
  }

  const sourceTabs: { label: string; value: SourceFilter }[] = [
    { label: "All", value: "all" },
    { label: "Tasks", value: "task" },
    { label: "Email", value: "email" },
    { label: "Client", value: "chat" },
    { label: "Upload", value: "manual" },
  ];

  // ─── Render markdown-like text ────────────────────────────────────────────
  function renderFormattedText(text: string) {
    const lines = text.split("\n");
    return (
      <div className="space-y-1 text-sm text-foreground/90 leading-relaxed">
        {lines.map((line, i) => {
          const boldLine = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
          if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
            return (
              <div key={i} className="flex gap-2 pl-2">
                <span className="text-brand-600 mt-0.5">&#8226;</span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: boldLine.replace(/^[\s]*[-*]\s*/, ""),
                  }}
                />
              </div>
            );
          }
          if (/^\d+\.\s/.test(line.trim())) {
            return (
              <div key={i} className="pl-2">
                <span dangerouslySetInnerHTML={{ __html: boldLine }} />
              </div>
            );
          }
          if (!line.trim()) return <div key={i} className="h-2" />;
          return <p key={i} dangerouslySetInnerHTML={{ __html: boldLine }} />;
        })}
      </div>
    );
  }

  // Brand-pill button used in the featured card.
  const featuredPillCls =
    "inline-flex items-center gap-1.5 rounded-full border border-brand-200/60 dark:border-brand-800/50 bg-brand-50 dark:bg-brand-950/40 px-2.5 py-1 text-[11px] font-semibold text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors";

  return (
    <div className="space-y-6">
      {/* ── A) Page header row ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-brand-700">
            Documents
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            All documents your team and clients have uploaded
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <span className="inline-flex items-center rounded-full border border-brand-200/60 bg-brand-100/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:border-brand-800/50 dark:bg-brand-900/40 dark:text-brand-300">
            {deptDisplayName}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={processInputRef}
              type="file"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => processInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              <Inbox className="size-4" />
              Upload to Process
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2 bg-brand-600 hover:bg-brand-700 text-white"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Upload Document
            </Button>
          </div>
        </div>
      </div>

      {/* ── B) Stat strip ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
          <span className="flex size-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
            <FileText className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold tabular-nums leading-tight text-foreground">
              {counts.total}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              Total Documents
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
          <span className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <Paperclip className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold tabular-nums leading-tight text-foreground">
              {counts.task}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              From Tasks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
          <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            <Mail className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold tabular-nums leading-tight text-foreground">
              {counts.email}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              From Emails
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
          <span className="flex size-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
            <Upload className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold tabular-nums leading-tight text-foreground">
              {counts.manual}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              From Uploads
            </p>
          </div>
        </div>
      </div>

      {/* ── C) Filter row ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit gap-1 rounded-full border border-border bg-muted/50 p-1">
          {sourceTabs.map((tab) => {
            const active = sourceFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setSourceFilter(tab.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 bg-muted/50"
          />
        </div>
      </div>

      {/* ── D) Featured document card ─────────────────────────────────── */}
      {featuredDoc && !loading && (
        <div className="flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
            <FileText className="size-7" />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-semibold text-foreground"
              title={featuredDoc.fileName}
            >
              {featuredDoc.fileName}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {typeLabels[getFileType(featuredDoc.mimeType, featuredDoc.fileName)]}
              {" "}&middot;{" "}
              {formatFileSize(featuredDoc.fileSize)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Uploaded by {uploaderFromLabel(featuredDoc)} &middot;{" "}
              {timeAgo(featuredDoc.createdAt)}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <a
                href={`/api/attachments/${featuredDoc.id}`}
                download
                className={featuredPillCls}
              >
                <Download className="size-3.5" />
                Download
              </a>
              {isAICompatible(featuredDoc.mimeType) && (
                <>
                  <button
                    type="button"
                    onClick={() => openAskModal(featuredDoc)}
                    className={featuredPillCls}
                  >
                    <Sparkles className="size-3.5" />
                    Ask AI
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimplify(featuredDoc)}
                    className={featuredPillCls}
                  >
                    <Wand2 className="size-3.5" />
                    Simplify
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="hidden flex-col items-end gap-2 sm:flex">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${sourceChipClasses[featuredDoc.source]}`}
            >
              {sourceChipLabels[featuredDoc.source]}
            </span>
            <p className="text-[11px] text-muted-foreground">
              Recently uploaded
            </p>
          </div>
        </div>
      )}

      {/* ── E) Document list rows ─────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-brand-600" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <FolderOpen className="size-6 text-muted-foreground" />
          </span>
          <p className="mt-3 text-sm font-medium text-foreground">
            No documents yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Documents from tasks, emails, chats and uploads will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          {/* Header row */}
          <div className="hidden grid-cols-[minmax(0,2.4fr)_minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-4 border-b border-border bg-muted/40 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
            <span>Document</span>
            <span>Type</span>
            <span>Uploaded By</span>
            <span>Date Uploaded</span>
            <span className="w-8" />
          </div>

          <ul className="divide-y divide-border">
            {sorted.map((doc) => {
              const fType = getFileType(doc.mimeType, doc.fileName);
              const isSelected = doc.id === selectedId;
              const isDeleting = deletingId === doc.id;
              const uploader = uploaderFromLabel(doc);
              return (
                <li key={`${doc.source}-${doc.id}`}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(doc.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedId(doc.id);
                      }
                    }}
                    className={`group grid cursor-pointer grid-cols-1 gap-3 px-5 py-3 transition-colors hover:bg-muted/40 sm:grid-cols-[minmax(0,2.4fr)_minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-4 ${
                      isSelected ? "bg-brand-50/40 dark:bg-brand-950/20" : ""
                    }`}
                  >
                    {/* Document */}
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                        <FileGlyph type={fType} className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p
                          className="truncate text-sm font-medium text-foreground"
                          title={doc.fileName}
                        >
                          {doc.fileName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {doc.sourceLabel}
                        </p>
                      </div>
                    </div>

                    {/* Type */}
                    <div>
                      <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {typeLabels[fType]}
                      </span>
                    </div>

                    {/* Uploaded by */}
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                        {initialsOf(uploader)}
                      </span>
                      <span className="truncate text-sm text-foreground">
                        {uploader}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
                      <Clock className="size-3" />
                      {timeAgo(doc.createdAt)}
                    </div>

                    {/* Row actions */}
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/api/attachments/${doc.id}`}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Download"
                      >
                        <Download className="size-4" />
                      </a>
                      {isAICompatible(doc.mimeType) && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAskModal(doc);
                            }}
                            className="inline-flex size-8 items-center justify-center rounded-md text-brand-600 transition-colors hover:bg-brand-50 dark:hover:bg-brand-950/40"
                            title="Ask AI"
                          >
                            <Brain className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSimplify(doc);
                            }}
                            className="inline-flex size-8 items-center justify-center rounded-md text-violet-500 transition-colors hover:bg-violet-50 dark:hover:bg-violet-950/40 dark:text-violet-300"
                            title="Simplify"
                          >
                            <Sparkles className="size-4" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc);
                        }}
                        disabled={isDeleting}
                        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        title="Delete"
                      >
                        {isDeleting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </button>
                      <span
                        className="hidden size-8 items-center justify-center rounded-md text-muted-foreground sm:inline-flex"
                        aria-hidden
                      >
                        <MoreHorizontal className="size-4" />
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ─── Ask AI Modal ──────────────────────────────────────────────────── */}
      {askModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  <Brain className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Ask AI</h2>
                  <p className="max-w-[300px] truncate text-xs text-muted-foreground">
                    {askModalDoc.fileName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAskModalDoc(null)}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
              {qaHistory.length === 0 && !askLoading && (
                <div className="py-8 text-center text-muted-foreground">
                  <Brain className="mx-auto mb-3 size-12 opacity-30" />
                  <p className="text-sm">Ask any question about this document</p>
                  <p className="mt-1 text-xs">
                    The AI will analyze the content and answer
                  </p>
                </div>
              )}
              {qaHistory.map((qa, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-brand-600 px-4 py-2.5 text-white">
                      <p className="text-sm">{qa.question}</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[90%] rounded-2xl rounded-tl-sm border bg-muted/40 px-4 py-3">
                      {renderFormattedText(qa.answer)}
                    </div>
                  </div>
                </div>
              ))}
              {askLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-sm border bg-muted/40 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin text-brand-600" />
                      Analyzing document...
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border px-6 py-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskSubmit();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  value={askQuestion}
                  onChange={(e) => setAskQuestion(e.target.value)}
                  placeholder="Ask a question about this document..."
                  disabled={askLoading}
                  className="flex-1"
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={askLoading || !askQuestion.trim()}
                  className="gap-2 bg-brand-600 px-4 text-white hover:bg-brand-700"
                >
                  {askLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── Simplify Modal ────────────────────────────────────────────────── */}
      {simplifyModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">AI Summary</h2>
                  <p className="max-w-[300px] truncate text-xs text-muted-foreground">
                    {simplifyModalDoc.fileName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSimplifyModalDoc(null);
                  setSimplifySummary("");
                }}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {simplifyLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="mb-3 size-8 animate-spin text-violet-500" />
                  <p className="text-sm">Analyzing and simplifying document...</p>
                  <p className="mt-1 text-xs">This may take a few seconds</p>
                </div>
              ) : (
                <div className="rounded-xl border bg-muted/40 p-5">
                  {renderFormattedText(simplifySummary)}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <button
                onClick={() => {
                  const doc = simplifyModalDoc;
                  setSimplifyModalDoc(null);
                  setSimplifySummary("");
                  if (doc) openAskModal(doc);
                }}
                className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                <Brain className="size-4" />
                Ask a follow-up question
              </button>
              <Button
                onClick={() => {
                  setSimplifyModalDoc(null);
                  setSimplifySummary("");
                }}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MessageSquare reference preserved for source iconography parity */}
      <span className="hidden">
        <MessageSquare className="size-4" />
        <CheckSquare className="size-4" />
      </span>
    </div>
  );
}
