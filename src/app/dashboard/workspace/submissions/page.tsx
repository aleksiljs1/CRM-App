"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Download,
  Loader2,
  Inbox,
  CheckCircle2,
  AlertTriangle,
  Search,
  Building2,
} from "lucide-react";

interface MatchedReq {
  id: string;
  documentName: string;
}
interface SubDoc {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedAt: string;
  aiConfidence: number | null;
  aiMatchedTo: MatchedReq | null;
}
interface RequiredDoc {
  id: string;
  documentName: string;
}
interface Submission {
  id: string;
  status: string;
  submittedAt: string;
  client: { companyName: string; contactName: string; contactEmail: string } | null;
  processType: {
    name: string;
    department: string;
    requiredDocuments: RequiredDoc[];
  };
  documents: SubDoc[];
}

function fmtSize(b: number) {
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / (1024 * 1024)).toFixed(1) + " MB";
}

function statusStyle(s: string) {
  switch (s) {
    case "COMPLETE":
    case "APPROVED":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    case "REJECTED":
      return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    case "UNDER_REVIEW":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

export default function ClientDocumentsPage() {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/submissions");
      setSubs(data.submissions || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = subs.filter((s) => {
    if (!q.trim()) return true;
    const hay = `${s.client?.companyName} ${s.client?.contactName} ${s.processType.name}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-brand-700 dark:text-brand-400">
            Client Documents
          </h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Documents submitted by clients for their processes
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search client or process…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Card className="flex items-center justify-center p-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No submissions yet</p>
          <p className="text-[13px] text-muted-foreground">
            When a client uploads documents for a process, they appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => {
            const matchedIds = new Set(
              s.documents.map((d) => d.aiMatchedTo?.id).filter(Boolean)
            );
            const missing = s.processType.requiredDocuments.filter(
              (r) => !matchedIds.has(r.id)
            );
            return (
              <Card key={s.id} className="overflow-hidden">
                {/* header */}
                <div className="flex flex-col gap-2 border-b border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-brand-600" />
                      <span className="truncate text-sm font-semibold text-foreground">
                        {s.client?.companyName || s.client?.contactName || "Unknown client"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      {s.processType.name} · {s.processType.department}
                    </p>
                  </div>
                  <span
                    className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(
                      s.status
                    )}`}
                  >
                    {s.status.replace(/_/g, " ")}
                  </span>
                </div>

                {/* uploaded files */}
                <div className="divide-y divide-border">
                  {s.documents.length === 0 && (
                    <p className="p-4 text-[13px] text-muted-foreground">
                      No files uploaded yet.
                    </p>
                  )}
                  {s.documents.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-3 p-3 px-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText className="h-4 w-4 shrink-0 text-red-500" />
                        <div className="min-w-0">
                          <p className="truncate text-sm text-foreground">
                            {d.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fmtSize(d.fileSize)}
                            {d.aiMatchedTo
                              ? ` · matched to "${d.aiMatchedTo.documentName}"${
                                  d.aiConfidence
                                    ? ` (${Math.round(d.aiConfidence * 100)}%)`
                                    : ""
                                }`
                              : " · not matched to a required document"}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`/api/submissions/${d.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </div>
                  ))}
                </div>

                {/* checklist status */}
                <div className="border-t border-border p-4 text-[13px]">
                  {missing.length === 0 ? (
                    <p className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      All required client documents received.
                    </p>
                  ) : (
                    <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Still missing: {missing.map((m) => m.documentName).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
