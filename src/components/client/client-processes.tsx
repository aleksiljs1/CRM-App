"use client";

import { useState, useRef } from "react";
import {
  FolderOpen,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
} from "lucide-react";

interface ProcessStatus {
  id: string;
  name: string;
  description: string | null;
  totalRequired: number;
  uploadedCount: number;
  missingDocs: string[];
  submissionId: string | null;
  status: string | null;
}

export function ClientProcessesSection({
  processes,
}: {
  processes: ProcessStatus[];
}) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, { complete: boolean; missing: string[]; matched: string[] }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null);

  async function handleUpload(processId: string, files: FileList) {
    setUploading(processId);
    try {
      const formData = new FormData();
      formData.append("processTypeId", processId);
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      const res = await fetch("/api/client/submissions", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.validation) {
        setFeedback((prev) => ({ ...prev, [processId]: data.validation }));
      }
    } catch {
      console.error("Upload failed");
    } finally {
      setUploading(null);
    }
  }

  function triggerUpload(processId: string) {
    setActiveProcessId(processId);
    fileInputRef.current?.click();
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0 && activeProcessId) {
      handleUpload(activeProcessId, e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
        onChange={onFileSelected}
        className="hidden"
      />
      {processes.map((proc) => {
        const fb = feedback[proc.id];
        const missingList = fb ? fb.missing : proc.missingDocs;
        const matchedCount = fb
          ? fb.matched.length
          : proc.uploadedCount;
        const isComplete = fb ? fb.complete : proc.uploadedCount >= proc.totalRequired && proc.totalRequired > 0;

        return (
          <div
            key={proc.id}
            className="rounded-xl border bg-card shadow-sm overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                  isComplete
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <FolderOpen className="size-4" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {proc.name}
                </p>
                {proc.totalRequired > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {matchedCount} of {proc.totalRequired} documents received
                    {missingList.length > 0 && (
                      <span className="text-amber-600 dark:text-amber-400">
                        {" "}-- Missing: {missingList.join(", ")}
                      </span>
                    )}
                  </p>
                )}
                {/* Progress bar */}
                {proc.totalRequired > 0 && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                    >
                      <div
                        className={`h-full rounded-full transition-[width] duration-500 ${
                          isComplete
                            ? "bg-emerald-500"
                            : "bg-brand-500 dark:bg-brand-400"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round((matchedCount / proc.totalRequired) * 100))}%`,
                        }}
                      />
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {matchedCount}/{proc.totalRequired}
                    </span>
                  </div>
                )}
              </div>

              {!isComplete && (
                <button
                  onClick={() => triggerUpload(proc.id)}
                  disabled={uploading === proc.id}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors shrink-0"
                >
                  {uploading === proc.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3" />
                  )}
                  Upload
                </button>
              )}
            </div>

            {/* AI feedback */}
            {fb && (
              <div
                className={`border-t px-4 py-2 text-xs ${
                  fb.complete
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                }`}
              >
                {fb.complete ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" />
                    All required documents have been received. Your submission is complete.
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3" />
                    {fb.matched.length} of {fb.matched.length + fb.missing.length} documents matched.
                    Missing: {fb.missing.join(", ")}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
