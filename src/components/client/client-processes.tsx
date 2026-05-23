"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  FolderOpen,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Brain,
  MessageSquare,
  XCircle,
  Send,
  X,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface RequiredDocInfo {
  id: string;
  documentName: string;
  description: string | null;
  isMandatory: boolean;
}

interface TeamTask {
  id: string;
  title: string;
  status: string;
  documentName: string | null;
  assignedTo: string;
}

interface ProcessStatus {
  id: string;
  name: string;
  description: string | null;
  totalRequired: number;
  uploadedCount: number;
  missingDocs: string[];
  submissionId: string | null;
  status: string | null;
  requiredDocuments: RequiredDocInfo[];
  teamTasks?: TeamTask[];
}

interface CheckResult {
  overallStatus: "COMPLETE" | "INCOMPLETE" | "NEEDS_REVIEW";
  summary: string;
  documents: {
    requiredDocument: string;
    status: "FOUND" | "MISSING" | "NEEDS_REVIEW";
    matchedFile: string | null;
    feedback: string;
  }[];
  suggestions: string[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function CheckResultsModal({
  result,
  processName,
  onClose,
}: {
  result: CheckResult;
  processName: string;
  onClose: () => void;
}) {
  const statusColor =
    result.overallStatus === "COMPLETE"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
      : result.overallStatus === "INCOMPLETE"
      ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
      : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Brain className="size-5 text-brand-600" />
            <h3 className="text-sm font-semibold text-foreground">
              AI Document Check
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-4">
          {/* Overall status */}
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor}`}
            >
              {result.overallStatus}
            </span>
            <p className="text-sm text-muted-foreground">{result.summary}</p>
          </div>

          {/* Document list */}
          <div className="space-y-2">
            {result.documents.map((doc, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border p-3"
              >
                {doc.status === "FOUND" ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                ) : doc.status === "MISSING" ? (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
                ) : (
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {doc.requiredDocument}
                  </p>
                  {doc.matchedFile && (
                    <p className="mt-0.5 text-xs text-brand-600 dark:text-brand-400">
                      Matched: {doc.matchedFile}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {doc.feedback}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 dark:border-brand-900/50 dark:bg-brand-950/30">
              <p className="text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Suggestions
              </p>
              <ul className="space-y-1">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-brand-600 dark:text-brand-400">
                    &bull; {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white hover:bg-brand-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function AskAIChatModal({
  docName,
  docDescription,
  submissionId,
  requiredDocumentId,
  onClose,
}: {
  docName: string;
  docDescription: string | null;
  submissionId: string;
  requiredDocumentId: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const question = input.trim();
    if (!question || sending) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: question },
    ];
    setMessages(newMessages);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/client/submissions/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          requiredDocumentId,
          question,
          history: messages,
        }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.answer }]);
    } catch {
      toast.error("Failed to get AI response. Please try again.");
      // Remove the user message if the AI failed
      setMessages(messages);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl" style={{ height: "min(70vh, 560px)" }}>
        {/* Header */}
        <div className="border-b px-5 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-5 text-brand-600" />
              <h3 className="text-sm font-semibold text-foreground">
                Ask AI: {docName}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
          {docDescription && (
            <p className="mt-1 text-xs text-muted-foreground">
              &ldquo;{docDescription}&rdquo;
            </p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Brain className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Ask anything about this document requirement.
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                e.g. &ldquo;What exactly do I need?&rdquo; or &ldquo;Is my uploaded file correct?&rdquo;
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-brand-600 text-white rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              disabled={sending}
              className="flex-1 rounded-xl border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="flex items-center justify-center rounded-xl bg-brand-600 p-2.5 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function ClientProcessesSection({
  processes,
}: {
  processes: ProcessStatus[];
}) {
  const [localProcesses, setLocalProcesses] = useState<ProcessStatus[]>(processes);
  const [uploading, setUploading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<
    Record<string, { complete: boolean; missing: string[]; matched: string[] }>
  >({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null);

  // AI Check state
  const [checking, setChecking] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<{
    processName: string;
    result: CheckResult;
  } | null>(null);

  // Ask AI chat state
  const [chatOpen, setChatOpen] = useState<{
    submissionId: string;
    requiredDocumentId: string;
    docName: string;
    docDescription: string | null;
  } | null>(null);

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
        // Update local process data to reflect new upload counts
        setLocalProcesses((prev) =>
          prev.map((p) =>
            p.id === processId
              ? {
                  ...p,
                  uploadedCount: p.totalRequired - (data.validation.missing?.length || 0),
                  missingDocs: data.validation.missing || [],
                  submissionId: data.submission?.id || p.submissionId,
                }
              : p
          )
        );
        toast.success(`${files.length} file(s) uploaded. AI matched them to requirements.`);
      }
    } catch {
      toast.error("Upload failed. Please try again.");
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

  async function handleCheckWithAI(proc: ProcessStatus) {
    if (!proc.submissionId) {
      toast.error("No documents uploaded yet for this process.");
      return;
    }
    setChecking(proc.id);
    try {
      const res = await fetch("/api/client/submissions/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: proc.submissionId }),
      });
      if (!res.ok) throw new Error("Check failed");
      const data = await res.json();
      setCheckResult({ processName: proc.name, result: data.result });
    } catch {
      toast.error("AI check failed. Please try again.");
    } finally {
      setChecking(null);
    }
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

      {localProcesses.map((proc) => {
        const fb = feedback[proc.id];
        const missingList = fb ? fb.missing : proc.missingDocs;
        const matchedCount = fb ? fb.matched.length : proc.uploadedCount;
        const isComplete =
          fb
            ? fb.complete
            : proc.uploadedCount >= proc.totalRequired &&
              proc.totalRequired > 0;
        const hasUploads = proc.uploadedCount > 0 || (fb && fb.matched.length > 0);

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
                        {" "}
                        -- Missing: {missingList.join(", ")}
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
                          width: `${Math.min(
                            100,
                            Math.round(
                              (matchedCount / proc.totalRequired) * 100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {matchedCount}/{proc.totalRequired}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Check with AI button */}
                {hasUploads && proc.submissionId && (
                  <button
                    onClick={() => handleCheckWithAI(proc)}
                    disabled={checking === proc.id}
                    className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50 transition-colors dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300 dark:hover:bg-brand-900/50"
                  >
                    {checking === proc.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Brain className="h-3 w-3" />
                    )}
                    Check with AI
                  </button>
                )}

                {!isComplete && (
                  <button
                    onClick={() => triggerUpload(proc.id)}
                    disabled={uploading === proc.id}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
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
            </div>

            {/* Required documents list with Ask AI buttons */}
            {proc.requiredDocuments.length > 0 && proc.submissionId && (
              <div className="border-t px-4 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Required Documents
                </p>
                <div className="space-y-1">
                  {proc.requiredDocuments.map((doc) => {
                    const isMissing = missingList.includes(doc.documentName);
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isMissing ? (
                            <AlertCircle className="size-3.5 shrink-0 text-amber-500" />
                          ) : (
                            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                          )}
                          <span className="text-xs text-foreground truncate">
                            {doc.documentName}
                          </span>
                          {doc.isMandatory && (
                            <span className="text-[10px] font-medium text-red-500 shrink-0">
                              *
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            setChatOpen({
                              submissionId: proc.submissionId!,
                              requiredDocumentId: doc.id,
                              docName: doc.documentName,
                              docDescription: doc.description,
                            })
                          }
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/40 transition-colors shrink-0"
                          title="Ask AI about this document"
                        >
                          <MessageSquare className="size-3" />
                          Ask AI
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI feedback from upload */}
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
                    All required documents have been received. Your submission is
                    complete.
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3" />
                    {fb.matched.length} of{" "}
                    {fb.matched.length + fb.missing.length} documents matched.
                    Missing: {fb.missing.join(", ")}
                  </span>
                )}
              </div>
            )}

            {/* Team Progress - what the legal team is working on */}
            {proc.teamTasks && proc.teamTasks.length > 0 && (
              <div className="border-t px-4 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Team Progress
                </p>
                <div className="space-y-1">
                  {proc.teamTasks.map((task) => {
                    const statusColors: Record<string, string> = {
                      TODO: "bg-gray-100 text-gray-600",
                      IN_PROGRESS: "bg-blue-100 text-blue-700",
                      REVIEW: "bg-amber-100 text-amber-700",
                      APPROVED: "bg-teal-100 text-teal-700",
                      COMPLETED: "bg-emerald-100 text-emerald-700",
                    };
                    const statusLabels: Record<string, string> = {
                      TODO: "Pending",
                      IN_PROGRESS: "In Progress",
                      REVIEW: "Under Review",
                      APPROVED: "Approved",
                      COMPLETED: "Done",
                    };
                    return (
                      <div
                        key={task.id}
                        className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 bg-muted/30"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">
                            {task.documentName || task.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Handled by {task.assignedTo}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            statusColors[task.status] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {statusLabels[task.status] || task.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Check Results Modal */}
      {checkResult && (
        <CheckResultsModal
          result={checkResult.result}
          processName={checkResult.processName}
          onClose={() => setCheckResult(null)}
        />
      )}

      {/* Ask AI Chat Modal */}
      {chatOpen && (
        <AskAIChatModal
          docName={chatOpen.docName}
          docDescription={chatOpen.docDescription}
          submissionId={chatOpen.submissionId}
          requiredDocumentId={chatOpen.requiredDocumentId}
          onClose={() => setChatOpen(null)}
        />
      )}
    </div>
  );
}
