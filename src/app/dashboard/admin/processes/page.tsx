"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  FolderOpen,
  X,
  Check,
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

const DEPT_LABELS: Record<string, string> = {
  AUDIT: "Audit",
  ACCOUNTING_TAX: "Accounting & Tax",
  BOOKKEEPING_PAYROLL: "Bookkeeping & Payroll",
  LEGAL: "Legal",
  ADVISORY: "Advisory",
  HR: "HR",
  MARKETING: "Marketing",
  FINANCE: "Finance",
};

const DEPARTMENTS = Object.keys(DEPT_LABELS);

export default function ProcessManagementPage() {
  const { data: session } = useSession();
  const [processes, setProcesses] = useState<ProcessType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal state for add/edit process
  const [showModal, setShowModal] = useState(false);
  const [editingProcess, setEditingProcess] = useState<ProcessType | null>(null);
  const [formName, setFormName] = useState("");
  const [formDept, setFormDept] = useState(DEPARTMENTS[0]);
  const [formDesc, setFormDesc] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Inline add document state
  const [addingDocFor, setAddingDocFor] = useState<string | null>(null);
  const [docName, setDocName] = useState("");
  const [docDesc, setDocDesc] = useState("");
  const [docMandatory, setDocMandatory] = useState(true);
  const [docSource, setDocSource] = useState<"CLIENT" | "INTERNAL">("CLIENT");
  const [docSaving, setDocSaving] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  useEffect(() => {
    fetchProcesses();
  }, []);

  async function fetchProcesses() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/processes");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProcesses(data);
    } catch {
      console.error("Failed to load processes");
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingProcess(null);
    setFormName("");
    setFormDept(DEPARTMENTS[0]);
    setFormDesc("");
    setFormActive(true);
    setShowModal(true);
  }

  function openEditModal(p: ProcessType) {
    setEditingProcess(p);
    setFormName(p.name);
    setFormDept(p.department);
    setFormDesc(p.description || "");
    setFormActive(p.isActive);
    setShowModal(true);
  }

  async function handleSaveProcess() {
    setSaving(true);
    try {
      if (editingProcess) {
        const res = await fetch("/api/admin/processes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProcess.id,
            name: formName,
            department: formDept,
            description: formDesc || null,
            isActive: formActive,
          }),
        });
        if (!res.ok) throw new Error("Failed to update");
      } else {
        const res = await fetch("/api/admin/processes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            department: formDept,
            description: formDesc || null,
            isActive: formActive,
          }),
        });
        if (!res.ok) throw new Error("Failed to create");
      }
      setShowModal(false);
      await fetchProcesses();
    } catch {
      console.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProcess(id: string) {
    try {
      const res = await fetch(`/api/admin/processes?id=${id}&type=process`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setDeletingId(null);
      await fetchProcesses();
    } catch {
      console.error("Delete failed");
    }
  }

  async function handleAddDocument(processTypeId: string) {
    setDocSaving(true);
    try {
      const res = await fetch("/api/admin/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processTypeId,
          documentName: docName,
          description: docDesc || null,
          isMandatory: docMandatory,
          source: docSource,
        }),
      });
      if (!res.ok) throw new Error("Failed to add document");
      setAddingDocFor(null);
      setDocName("");
      setDocDesc("");
      setDocMandatory(true);
      setDocSource("CLIENT");
      await fetchProcesses();
    } catch {
      console.error("Add document failed");
    } finally {
      setDocSaving(false);
    }
  }

  async function handleDeleteDocument(docId: string) {
    try {
      const res = await fetch(`/api/admin/processes?id=${docId}&type=document`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete document");
      setDeletingDocId(null);
      await fetchProcesses();
    } catch {
      console.error("Delete document failed");
    }
  }

  // Group processes by department
  const grouped = processes.reduce(
    (acc, p) => {
      if (!acc[p.department]) acc[p.department] = [];
      acc[p.department].push(p);
      return acc;
    },
    {} as Record<string, ProcessType[]>
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600 dark:text-brand-400" />
          <p className="text-sm text-muted-foreground">Loading process types...</p>
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
            Process Type Management
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Manage service types, departments, and required documents
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add Process Type
        </button>
      </div>

      {/* Grouped list */}
      {Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 shadow-sm">
          <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <FolderOpen className="size-6 text-muted-foreground" />
          </span>
          <p className="mt-3 text-sm font-medium text-foreground">No process types yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Click &quot;Add Process Type&quot; to get started.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([dept, items]) => (
          <section key={dept}>
            <div className="flex items-center gap-1.5 mb-3">
              <FileText className="size-3 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {DEPT_LABELS[dept] || dept}
              </span>
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {items.length}
              </span>
            </div>

            <div className="space-y-3">
              {items.map((p) => (
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

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        p.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </span>

                    <span className="shrink-0 text-xs text-muted-foreground">
                      {p._count.requiredDocuments} doc{p._count.requiredDocuments !== 1 ? "s" : ""}
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(p)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {deletingId === p.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteProcess(p.id)}
                            className="rounded-md p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Confirm delete"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(p.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded: required documents */}
                  {expandedId === p.id && (
                    <div className="border-t bg-muted/30 px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Required Documents
                        </p>
                        <button
                          onClick={() => {
                            setAddingDocFor(p.id);
                            setDocName("");
                            setDocDesc("");
                            setDocMandatory(true);
                            setDocSource("CLIENT");
                          }}
                          className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                        >
                          <Plus className="h-3 w-3" />
                          Add Document
                        </button>
                      </div>

                      {p.requiredDocuments.length === 0 && addingDocFor !== p.id && (
                        <p className="text-xs text-muted-foreground py-2">
                          No required documents defined.
                        </p>
                      )}

                      <div className="space-y-2">
                        {p.requiredDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-3 rounded-lg bg-card border px-4 py-2.5"
                          >
                            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
                                doc.source === "INTERNAL"
                                  ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              }`}
                            >
                              {doc.source === "INTERNAL" ? "Internal" : "Client"}
                            </span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                doc.isMandatory
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {doc.isMandatory ? "Mandatory" : "Optional"}
                            </span>
                            {deletingDocId === doc.id ? (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="rounded-md p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                  title="Confirm"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => setDeletingDocId(null)}
                                  className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
                                  title="Cancel"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeletingDocId(doc.id)}
                                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition-colors"
                                title="Delete document"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}

                        {/* Inline add document form */}
                        {addingDocFor === p.id && (
                          <div className="rounded-lg border border-brand-200 dark:border-brand-800 bg-card p-4 space-y-3">
                            <input
                              type="text"
                              placeholder="Document name"
                              value={docName}
                              onChange={(e) => setDocName(e.target.value)}
                              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                            <input
                              type="text"
                              placeholder="Description (optional)"
                              value={docDesc}
                              onChange={(e) => setDocDesc(e.target.value)}
                              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                            <div className="flex items-center gap-4">
                              <select
                                value={docSource}
                                onChange={(e) => setDocSource(e.target.value as "CLIENT" | "INTERNAL")}
                                className="rounded-md border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                              >
                                <option value="CLIENT">Client</option>
                                <option value="INTERNAL">Internal</option>
                              </select>
                              <label className="flex items-center gap-2 text-sm text-foreground">
                                <input
                                  type="checkbox"
                                  checked={docMandatory}
                                  onChange={(e) => setDocMandatory(e.target.checked)}
                                  className="rounded border-border accent-brand-600"
                                />
                                Mandatory
                              </label>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setAddingDocFor(null)}
                                  className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleAddDocument(p.id)}
                                  disabled={!docName.trim() || docSaving}
                                  className="flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
                                >
                                  {docSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                                  Add
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {/* Add/Edit Process Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">
                {editingProcess ? "Edit Process Type" : "Add Process Type"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Annual Audit"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Department
                </label>
                <select
                  value={formDept}
                  onChange={(e) => setFormDept(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {DEPT_LABELS[d]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="rounded border-border accent-brand-600"
                />
                Active
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProcess}
                disabled={!formName.trim() || saving}
                className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingProcess ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
