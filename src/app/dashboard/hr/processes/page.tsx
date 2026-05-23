"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  FolderOpen,
  X,
  Trash2,
  Users,
  Building2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface RequiredDocument {
  id: string;
  processTypeId: string;
  documentName: string;
  description: string | null;
  isMandatory: boolean;
  source: string;
}

interface ProcessType {
  id: string;
  name: string;
  department: string;
  description: string | null;
  isActive: boolean;
  requiredDocuments: RequiredDocument[];
  _count: { requiredDocuments: number };
}

interface DocFormRow {
  name: string;
  description: string;
  isMandatory: boolean;
}

export default function LegalProcessesPage() {
  const { data: session } = useSession();
  const userDept = session?.user?.department;
  const userRole = session?.user?.role;

  const [processes, setProcesses] = useState<ProcessType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New process modal
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [clientDocs, setClientDocs] = useState<DocFormRow[]>([]);
  const [internalDocs, setInternalDocs] = useState<DocFormRow[]>([]);
  const [saving, setSaving] = useState(false);

  // Restrict to LEGAL managers or ADMIN
  const isAllowed = userRole === "ADMIN" || (userRole === "MANAGER" && userDept === "LEGAL");

  useEffect(() => {
    if (isAllowed) fetchProcesses();
  }, [isAllowed]);

  async function fetchProcesses() {
    try {
      setLoading(true);
      const deptParam = userRole === "ADMIN" ? "" : "?department=LEGAL";
      const res = await fetch(`/api/processes${deptParam}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProcesses(data.processes || []);
    } catch {
      console.error("Failed to load processes");
    } finally {
      setLoading(false);
    }
  }

  function openModal() {
    setFormName("");
    setFormDesc("");
    setClientDocs([]);
    setInternalDocs([]);
    setShowModal(true);
  }

  function addDocRow(source: "CLIENT" | "INTERNAL") {
    const row: DocFormRow = { name: "", description: "", isMandatory: true };
    if (source === "CLIENT") {
      setClientDocs((prev) => [...prev, row]);
    } else {
      setInternalDocs((prev) => [...prev, row]);
    }
  }

  function updateDocRow(
    source: "CLIENT" | "INTERNAL",
    index: number,
    field: keyof DocFormRow,
    value: string | boolean
  ) {
    const setter = source === "CLIENT" ? setClientDocs : setInternalDocs;
    setter((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function removeDocRow(source: "CLIENT" | "INTERNAL", index: number) {
    const setter = source === "CLIENT" ? setClientDocs : setInternalDocs;
    setter((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreateProcess() {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const documents = [
        ...clientDocs
          .filter((d) => d.name.trim())
          .map((d) => ({
            name: d.name,
            description: d.description || undefined,
            source: "CLIENT",
            isMandatory: d.isMandatory,
          })),
        ...internalDocs
          .filter((d) => d.name.trim())
          .map((d) => ({
            name: d.name,
            description: d.description || undefined,
            source: "INTERNAL",
            isMandatory: d.isMandatory,
          })),
      ];

      const res = await fetch("/api/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          department: "LEGAL",
          description: formDesc || null,
          documents,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setShowModal(false);
      await fetchProcesses();
    } catch {
      console.error("Create process failed");
    } finally {
      setSaving(false);
    }
  }

  if (!isAllowed) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Access restricted to Legal department managers and administrators.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600 dark:text-brand-400" />
          <p className="text-sm text-muted-foreground">Loading legal processes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-brand-700 dark:text-brand-300">
            Legal Processes
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Manage legal service processes and their required documents
          </p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New Process
        </button>
      </div>

      {/* Process list */}
      {processes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 shadow-sm">
          <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <FolderOpen className="size-6 text-muted-foreground" />
          </span>
          <p className="mt-3 text-sm font-medium text-foreground">No legal processes yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Click &quot;New Process&quot; to create your first legal process.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {processes.map((p) => {
            const clientCount = p.requiredDocuments.filter(
              (d) => d.source === "CLIENT"
            ).length;
            const internalCount = p.requiredDocuments.filter(
              (d) => d.source === "INTERNAL"
            ).length;

            return (
              <div
                key={p.id}
                className="rounded-xl border bg-card shadow-sm overflow-hidden"
              >
                {/* Process row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === p.id ? null : p.id)
                    }
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {expandedId === p.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {p.name}
                    </p>
                    {p.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {p.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      <Users className="h-2.5 w-2.5" />
                      {clientCount} client
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                      <Building2 className="h-2.5 w-2.5" />
                      {internalCount} internal
                    </span>
                  </div>
                </div>

                {/* Expanded: required documents grouped by source */}
                {expandedId === p.id && (
                  <div className="border-t bg-muted/30 px-5 py-4 space-y-4">
                    {/* Client documents */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Users className="size-3 text-blue-600" />
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700 dark:text-blue-300">
                          Client Documents
                        </span>
                      </div>
                      {p.requiredDocuments.filter((d) => d.source === "CLIENT")
                        .length === 0 ? (
                        <p className="text-xs text-muted-foreground py-1 pl-4">
                          No client documents defined.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {p.requiredDocuments
                            .filter((d) => d.source === "CLIENT")
                            .map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center gap-3 rounded-lg bg-card border px-4 py-2.5"
                              >
                                <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground">
                                    {doc.documentName}
                                  </p>
                                  {doc.description && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {doc.description}
                                    </p>
                                  )}
                                </div>
                                <span
                                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    doc.isMandatory
                                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {doc.isMandatory ? "Mandatory" : "Optional"}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Internal documents */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Building2 className="size-3 text-violet-600" />
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-700 dark:text-violet-300">
                          Internal Documents
                        </span>
                      </div>
                      {p.requiredDocuments.filter((d) => d.source === "INTERNAL")
                        .length === 0 ? (
                        <p className="text-xs text-muted-foreground py-1 pl-4">
                          No internal documents defined.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {p.requiredDocuments
                            .filter((d) => d.source === "INTERNAL")
                            .map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center gap-3 rounded-lg bg-card border px-4 py-2.5"
                              >
                                <FileText className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground">
                                    {doc.documentName}
                                  </p>
                                  {doc.description && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {doc.description}
                                    </p>
                                  )}
                                </div>
                                <span
                                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    doc.isMandatory
                                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {doc.isMandatory ? "Mandatory" : "Optional"}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Process Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-xl border bg-card shadow-xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <h2 className="text-lg font-semibold text-foreground">
                New Legal Process
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-4 space-y-5">
              {/* Basic info */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Process Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Company Registration"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Optional description of this process..."
                  rows={2}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              {/* Client Documents Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="size-4 text-blue-600" />
                    <span className="text-sm font-semibold text-foreground">
                      Client Documents
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (docs the client must provide)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addDocRow("CLIENT")}
                    className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                </div>
                {clientDocs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 pl-5">
                    No client documents added yet. Click &quot;Add&quot; above.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {clientDocs.map((row, idx) => (
                      <DocRowForm
                        key={idx}
                        row={row}
                        onChange={(field, value) =>
                          updateDocRow("CLIENT", idx, field, value)
                        }
                        onRemove={() => removeDocRow("CLIENT", idx)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Internal Documents Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="size-4 text-violet-600" />
                    <span className="text-sm font-semibold text-foreground">
                      Internal Documents
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (docs the legal team must produce)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addDocRow("INTERNAL")}
                    className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                </div>
                {internalDocs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 pl-5">
                    No internal documents added yet. Click &quot;Add&quot; above.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {internalDocs.map((row, idx) => (
                      <DocRowForm
                        key={idx}
                        row={row}
                        onChange={(field, value) =>
                          updateDocRow("INTERNAL", idx, field, value)
                        }
                        onRemove={() => removeDocRow("INTERNAL", idx)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProcess}
                disabled={!formName.trim() || saving}
                className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocRowForm({
  row,
  onChange,
  onRemove,
}: {
  row: DocFormRow;
  onChange: (field: keyof DocFormRow, value: string | boolean) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex-1 space-y-2">
        <input
          type="text"
          placeholder="Document name"
          value={row.name}
          onChange={(e) => onChange("name", e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={row.description}
          onChange={(e) => onChange("description", e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <label className="flex items-center gap-2 text-xs text-foreground">
          <button
            type="button"
            onClick={() => onChange("isMandatory", !row.isMandatory)}
            className="text-muted-foreground hover:text-foreground"
          >
            {row.isMandatory ? (
              <ToggleRight className="h-5 w-5 text-brand-600" />
            ) : (
              <ToggleLeft className="h-5 w-5" />
            )}
          </button>
          {row.isMandatory ? "Mandatory" : "Optional"}
        </label>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="mt-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-red-600 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
