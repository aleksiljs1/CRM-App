"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  File,
  Image,
  CheckSquare,
  Mail,
  MessageSquare,
  Search,
  Download,
  Loader2,
  LayoutGrid,
  List,
  FolderOpen,
  FileSpreadsheet,
  Upload,
  X,
  Trash2,
  Brain,
  Sparkles,
  Send,
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
type SortField = "fileName" | "fileSize" | "createdAt" | "source";
type SortDir = "asc" | "desc";

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
  if (minutes < 60) return `${minutes}m ago`;
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

function FileIcon({
  type,
  size = "lg",
}: {
  type: "pdf" | "word" | "excel" | "image" | "other";
  size?: "sm" | "lg";
}) {
  const sizeClass = size === "lg" ? "h-10 w-10" : "h-5 w-5";
  switch (type) {
    case "pdf":
      return <FileText className={`${sizeClass} text-red-500`} />;
    case "word":
      return <FileText className={`${sizeClass} text-blue-500`} />;
    case "excel":
      return <FileSpreadsheet className={`${sizeClass} text-green-600`} />;
    case "image":
      return <Image className={`${sizeClass} text-purple-500`} />;
    default:
      return <File className={`${sizeClass} text-gray-400`} />;
  }
}

const sourceColors: Record<string, string> = {
  task: "bg-[#00968a]/10 text-[#00968a] border-[#00968a]/30",
  email: "bg-blue-50 text-blue-700 border-blue-200",
  chat: "bg-purple-50 text-purple-700 border-purple-200",
  manual: "bg-orange-50 text-orange-700 border-orange-200",
};

const sourceIcons: Record<string, React.ReactNode> = {
  task: <CheckSquare className="h-3 w-3" />,
  email: <Mail className="h-3 w-3" />,
  chat: <MessageSquare className="h-3 w-3" />,
  manual: <Upload className="h-3 w-3" />,
};

const typeLabels: Record<string, string> = {
  pdf: "PDF",
  word: "Word",
  excel: "Excel",
  image: "Image",
  other: "Other",
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function HRDocumentsPage() {
  const { data: session } = useSession();
  const dept = session?.user?.department || null;

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
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Modal state
  const [askModalDoc, setAskModalDoc] = useState<UnifiedDocument | null>(null);
  const [askQuestion, setAskQuestion] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [qaHistory, setQaHistory] = useState<QAEntry[]>([]);

  const [simplifyModalDoc, setSimplifyModalDoc] = useState<UnifiedDocument | null>(null);
  const [simplifyLoading, setSimplifyLoading] = useState(false);
  const [simplifySummary, setSimplifySummary] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    }
  }

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

  // Client-side sort
  const sorted = [...documents].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortField) {
      case "fileName":
        return a.fileName.localeCompare(b.fileName) * dir;
      case "fileSize":
        return (a.fileSize - b.fileSize) * dir;
      case "source":
        return a.source.localeCompare(b.source) * dir;
      case "createdAt":
      default:
        return (
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
          dir
        );
    }
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

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
    { label: "Emails", value: "email" },
    { label: "Chats", value: "chat" },
    { label: "Uploaded", value: "manual" },
  ];

  const typeOptions: { label: string; value: TypeFilter }[] = [
    { label: "All Types", value: "all" },
    { label: "PDF", value: "pdf" },
    { label: "Word", value: "word" },
    { label: "Excel", value: "excel" },
    { label: "Images", value: "image" },
    { label: "Other", value: "other" },
  ];

  // ─── Render helpers for AI action buttons ─────────────────────────────────
  function renderActionButtons(doc: UnifiedDocument, variant: "grid" | "list") {
    const aiOk = isAICompatible(doc.mimeType);
    const isDeleting = deletingId === doc.id;

    if (variant === "grid") {
      return (
        <div className="border-t border-gray-100 p-3 flex items-center gap-2">
          <a
            href={`/api/attachments/${doc.id}`}
            download
            className="flex items-center justify-center gap-1.5 flex-1 rounded-lg bg-gray-50 hover:bg-[#00968a] hover:text-white text-gray-600 text-xs font-medium py-2 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
          {aiOk && (
            <>
              <button
                onClick={() => openAskModal(doc)}
                className="flex items-center justify-center gap-1 rounded-lg bg-[#00968a]/10 hover:bg-[#00968a] hover:text-white text-[#00968a] text-xs font-medium py-2 px-2.5 transition-colors"
                title="Ask AI about this document"
              >
                <Brain className="h-3.5 w-3.5" />
                Ask AI
              </button>
              <button
                onClick={() => handleSimplify(doc)}
                className="flex items-center justify-center gap-1 rounded-lg bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-600 text-xs font-medium py-2 px-2.5 transition-colors"
                title="AI Simplify"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Simplify
              </button>
            </>
          )}
          <button
            onClick={() => handleDelete(doc)}
            disabled={isDeleting}
            className="flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-500 hover:text-white text-red-500 text-xs font-medium py-2 px-2 transition-colors disabled:opacity-50"
            title="Delete document"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      );
    }

    // list variant
    return (
      <div className="flex items-center gap-1">
        <a
          href={`/api/attachments/${doc.id}`}
          download
          className="inline-flex items-center gap-1 text-[#00968a] hover:text-[#007a70] text-sm font-medium p-1"
          title="Download"
        >
          <Download className="h-4 w-4" />
        </a>
        {aiOk && (
          <>
            <button
              onClick={() => openAskModal(doc)}
              className="inline-flex items-center text-[#00968a] hover:text-[#007a70] p-1"
              title="Ask AI"
            >
              <Brain className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleSimplify(doc)}
              className="inline-flex items-center text-purple-500 hover:text-purple-700 p-1"
              title="Simplify"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </>
        )}
        <button
          onClick={() => handleDelete(doc)}
          disabled={isDeleting}
          className="inline-flex items-center text-red-400 hover:text-red-600 p-1 disabled:opacity-50"
          title="Delete"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  }

  // ─── Render markdown-like text ────────────────────────────────────────────
  function renderFormattedText(text: string) {
    const lines = text.split("\n");
    return (
      <div className="space-y-1 text-sm text-gray-700 leading-relaxed">
        {lines.map((line, i) => {
          // Bold headers like **Key points**:
          const boldLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
          // Bullet points
          if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
            return (
              <div key={i} className="flex gap-2 pl-2">
                <span className="text-[#00968a] mt-0.5">&#8226;</span>
                <span dangerouslySetInnerHTML={{ __html: boldLine.replace(/^[\s]*[-*]\s*/, '') }} />
              </div>
            );
          }
          // Numbered items
          if (/^\d+\.\s/.test(line.trim())) {
            return (
              <div key={i} className="pl-2">
                <span dangerouslySetInnerHTML={{ __html: boldLine }} />
              </div>
            );
          }
          // Empty lines
          if (!line.trim()) return <div key={i} className="h-2" />;
          // Regular text
          return <p key={i} dangerouslySetInnerHTML={{ __html: boldLine }} />;
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getDeptName(dept)} Documents
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            All your files in one place
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-[#00968a] hover:bg-[#007a70] text-white"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload Documents
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <FolderOpen className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {counts.total}
              </p>
              <p className="text-xs text-gray-500">Total Documents</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00968a]/10">
              <CheckSquare className="h-5 w-5 text-[#00968a]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{counts.task}</p>
              <p className="text-xs text-gray-500">From Tasks</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{counts.email}</p>
              <p className="text-xs text-gray-500">From Emails</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{counts.chat}</p>
              <p className="text-xs text-gray-500">From Chats</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
              <Upload className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{counts.manual}</p>
              <p className="text-xs text-gray-500">Uploaded</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Source tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {sourceTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSourceFilter(tab.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                sourceFilter === tab.value
                  ? "bg-white text-[#00968a] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00968a]/30 focus:border-[#00968a]"
        >
          {typeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-9 border-gray-200 focus-visible:ring-[#00968a]/30"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "grid"
                ? "bg-[#00968a]/10 text-[#00968a]"
                : "text-gray-400 hover:text-gray-600"
            }`}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "list"
                ? "bg-[#00968a]/10 text-[#00968a]"
                : "text-gray-400 hover:text-gray-600"
            }`}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#00968a]" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
            <FolderOpen className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No documents yet
          </h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Documents from your tasks, emails, and chats will appear here
            automatically.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* ─── Grid View ──────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sorted.map((doc) => {
            const fType = getFileType(doc.mimeType, doc.fileName);
            return (
              <Card
                key={`${doc.source}-${doc.id}`}
                className="group relative flex flex-col border border-gray-200 hover:border-[#00968a]/40 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Icon area */}
                <div className="flex items-center justify-center pt-6 pb-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 group-hover:bg-[#00968a]/5 transition-colors">
                    <FileIcon type={fType} size="lg" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 px-4 pb-2 space-y-1">
                  <p
                    className="text-sm font-medium text-gray-900 truncate"
                    title={doc.fileName}
                  >
                    {doc.fileName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span className="text-gray-300">|</span>
                    <span className="uppercase">
                      {typeLabels[fType]}
                    </span>
                  </div>
                </div>

                {/* Source badge & time */}
                <div className="px-4 pb-3 space-y-2">
                  <Badge
                    variant="outline"
                    className={`text-xs gap-1 ${sourceColors[doc.source]}`}
                  >
                    {sourceIcons[doc.source]}
                    <span className="truncate max-w-[140px]">
                      {doc.sourceLabel}
                    </span>
                  </Badge>
                  <p className="text-xs text-gray-400">
                    {timeAgo(doc.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                {renderActionButtons(doc, "grid")}
              </Card>
            );
          })}
        </div>
      ) : (
        /* ─── List View ──────────────────────────────────────────────── */
        <Card className="border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th
                    className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                    onClick={() => toggleSort("fileName")}
                  >
                    File Name{" "}
                    {sortField === "fileName" &&
                      (sortDir === "asc" ? " ^" : " v")}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-20">
                    Type
                  </th>
                  <th
                    className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none w-24"
                    onClick={() => toggleSort("fileSize")}
                  >
                    Size{" "}
                    {sortField === "fileSize" &&
                      (sortDir === "asc" ? " ^" : " v")}
                  </th>
                  <th
                    className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                    onClick={() => toggleSort("source")}
                  >
                    Source{" "}
                    {sortField === "source" &&
                      (sortDir === "asc" ? " ^" : " v")}
                  </th>
                  <th
                    className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none w-28"
                    onClick={() => toggleSort("createdAt")}
                  >
                    Date{" "}
                    {sortField === "createdAt" &&
                      (sortDir === "asc" ? " ^" : " v")}
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 w-40">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((doc) => {
                  const fType = getFileType(doc.mimeType, doc.fileName);
                  return (
                    <tr
                      key={`${doc.source}-${doc.id}`}
                      className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <FileIcon type={fType} size="sm" />
                          <span
                            className="font-medium text-gray-900 truncate max-w-[260px]"
                            title={doc.fileName}
                          >
                            {doc.fileName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-gray-500 uppercase">
                          {typeLabels[fType]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={`text-xs gap-1 ${sourceColors[doc.source]}`}
                        >
                          {sourceIcons[doc.source]}
                          <span className="truncate max-w-[160px]">
                            {doc.sourceLabel}
                          </span>
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">
                        {timeAgo(doc.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {renderActionButtons(doc, "list")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ─── Ask AI Modal ──────────────────────────────────────────────────── */}
      {askModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00968a]/10">
                  <Brain className="h-5 w-5 text-[#00968a]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Ask AI</h2>
                  <p className="text-xs text-gray-500 truncate max-w-[300px]">
                    {askModalDoc.fileName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAskModalDoc(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Q&A history */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {qaHistory.length === 0 && !askLoading && (
                <div className="text-center py-8 text-gray-400">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Ask any question about this document</p>
                  <p className="text-xs mt-1">The AI will analyze the content and answer</p>
                </div>
              )}
              {qaHistory.map((qa, i) => (
                <div key={i} className="space-y-3">
                  {/* User question */}
                  <div className="flex justify-end">
                    <div className="bg-[#00968a] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                      <p className="text-sm">{qa.question}</p>
                    </div>
                  </div>
                  {/* AI answer */}
                  <div className="flex justify-start">
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%]">
                      {renderFormattedText(qa.answer)}
                    </div>
                  </div>
                </div>
              ))}
              {askLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin text-[#00968a]" />
                      Analyzing document...
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="px-6 py-4 border-t border-gray-100">
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
                  className="flex-1 border-gray-200 focus-visible:ring-[#00968a]/30"
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={askLoading || !askQuestion.trim()}
                  className="bg-[#00968a] hover:bg-[#007a70] text-white px-4"
                >
                  {askLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">AI Summary</h2>
                  <p className="text-xs text-gray-500 truncate max-w-[300px]">
                    {simplifyModalDoc.fileName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSimplifyModalDoc(null);
                  setSimplifySummary("");
                }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Summary content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {simplifyLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-3" />
                  <p className="text-sm">Analyzing and simplifying document...</p>
                  <p className="text-xs mt-1">This may take a few seconds</p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                  {renderFormattedText(simplifySummary)}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
              <button
                onClick={() => {
                  const doc = simplifyModalDoc;
                  setSimplifyModalDoc(null);
                  setSimplifySummary("");
                  if (doc) openAskModal(doc);
                }}
                className="text-sm text-[#00968a] hover:text-[#007a70] font-medium flex items-center gap-1.5"
              >
                <Brain className="h-4 w-4" />
                Ask a follow-up question
              </button>
              <Button
                onClick={() => {
                  setSimplifyModalDoc(null);
                  setSimplifySummary("");
                }}
                variant="outline"
                className="border-gray-200"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
