"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  Clock,
  Save,
  Loader2,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Play,
  Copy,
  Download,
  ChevronDown,
  ChevronRight,
  X,
  type LucideIcon,
} from "lucide-react";

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3 text-muted-foreground" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {children}
      </span>
    </div>
  );
}

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

/* ───── Types ───── */

interface ProcessType {
  id: string;
  name: string;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  department: string;
  processTypeId: string | null;
  content: string;
  placeholders: string[] | null;
  createdById: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  processType: { id: string; name: string } | null;
  createdBy: { id: string; name: string };
}

/* ───── Placeholder extraction helper ───── */

function extractPlaceholders(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))];
}

/* ───── Modal Backdrop ───── */

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 mx-4 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border bg-card p-6 shadow-xl">
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ManagerSettingsPage() {
  const { data: session } = useSession();
  const dept = session?.user?.department || null;
  const role = session?.user?.role || "";
  const deptName = getDeptName(dept);
  const isLegal = dept === "LEGAL" || role === "ADMIN";

  /* ── Auto-assign state ── */
  const [autoAssignHours, setAutoAssignHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string | null>(null);

  /* ── Templates state ── */
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [processes, setProcesses] = useState<ProcessType[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ── Create/Edit modal ── */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formProcessTypeId, setFormProcessTypeId] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  /* ── Fill/Use modal ── */
  const [fillTemplate, setFillTemplate] = useState<Template | null>(null);
  const [fillValues, setFillValues] = useState<Record<string, string>>({});

  /* ── Data loading ── */
  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data } = await axios.get("/api/department-settings");
        setAutoAssignHours(data.settings.autoAssignReviewHours);
        setLastUpdatedBy(data.settings.updatedBy?.name || null);
      } catch {
        // defaults are fine
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const fetchTemplates = useCallback(async () => {
    if (!isLegal) return;
    setTemplatesLoading(true);
    try {
      const { data } = await axios.get("/api/templates");
      setTemplates(data.templates);
    } catch {
      // ignore
    } finally {
      setTemplatesLoading(false);
    }
  }, [isLegal]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (!isLegal) return;
    async function fetchProcesses() {
      try {
        const { data } = await axios.get("/api/processes");
        setProcesses(data.processes);
      } catch {
        // ignore
      }
    }
    fetchProcesses();
  }, [isLegal]);

  /* ── Auto-assign save ── */
  async function handleSave() {
    setSaving(true);
    try {
      const { data } = await axios.patch("/api/department-settings", {
        autoAssignReviewHours: autoAssignHours,
      });
      setLastUpdatedBy(data.settings.updatedBy?.name || null);
      toast.success("Settings saved successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  /* ── Template CRUD ── */
  function openCreateModal() {
    setEditingTemplate(null);
    setFormName("");
    setFormDescription("");
    setFormProcessTypeId("");
    setFormContent("");
    setShowCreateModal(true);
  }

  function openEditModal(t: Template) {
    setEditingTemplate(t);
    setFormName(t.name);
    setFormDescription(t.description || "");
    setFormProcessTypeId(t.processTypeId || "");
    setFormContent(t.content);
    setShowCreateModal(true);
  }

  async function handleCreateOrEdit() {
    if (!formName.trim() || !formContent.trim()) {
      toast.error("Name and content are required");
      return;
    }
    setFormSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        processTypeId: formProcessTypeId || null,
        content: formContent,
      };
      if (editingTemplate) {
        await axios.patch(`/api/templates/${editingTemplate.id}`, payload);
        toast.success("Template updated");
      } else {
        await axios.post("/api/templates", payload);
        toast.success("Template created");
      }
      setShowCreateModal(false);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save template");
    } finally {
      setFormSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await axios.delete(`/api/templates/${id}`);
      toast.success("Template deleted");
      fetchTemplates();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete template");
    }
  }

  /* ── Fill/Use ── */
  function openFillModal(t: Template) {
    setFillTemplate(t);
    const initial: Record<string, string> = {};
    (t.placeholders || []).forEach((p) => (initial[p] = ""));
    setFillValues(initial);
  }

  const filledPreview = useMemo(() => {
    if (!fillTemplate) return "";
    let result = fillTemplate.content;
    for (const [key, value] of Object.entries(fillValues)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, value || `{{${key}}}`);
    }
    return result;
  }, [fillTemplate, fillValues]);

  function copyToClipboard() {
    navigator.clipboard.writeText(filledPreview);
    toast.success("Copied to clipboard");
  }

  function downloadAsText() {
    if (!fillTemplate) return;
    const blob = new Blob([filledPreview], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fillTemplate.name.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const detectedPlaceholders = useMemo(
    () => extractPlaceholders(formContent),
    [formContent]
  );

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600 dark:text-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-brand-700 dark:text-brand-400">
            {deptName} Settings
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Configure department workflow and automation rules
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <span className="inline-flex items-center rounded-full border border-brand-200/60 bg-brand-100/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:border-brand-800/50 dark:bg-brand-900/40 dark:text-brand-300">
            {deptName}
          </span>
        </div>
      </div>

      {/* ── Auto-Assign Section ── */}
      <section>
        <SectionLabel icon={Clock}>Review Auto-Assignment</SectionLabel>
        <div className="mt-3 rounded-xl border bg-card p-4 md:p-5 shadow-xs space-y-4">
          <p className="text-sm text-muted-foreground">
            When a task is sent for review and no reviewer is assigned within
            this time, the system will automatically assign it to the Senior or
            Associate with the fewest active reviews in your department.
          </p>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium whitespace-nowrap text-foreground">
              Auto-assign after:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={168}
                value={autoAssignHours}
                onChange={(e) =>
                  setAutoAssignHours(
                    Math.max(1, Math.min(168, parseInt(e.target.value) || 1))
                  )
                }
                className="w-20 h-9 rounded-lg border border-border bg-background px-3 text-sm text-center tabular-nums text-brand-700 dark:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
              <span className="text-sm text-muted-foreground">hours</span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Settings className="h-4 w-4 shrink-0" />
            <div>
              <p>Quick presets:</p>
              <div className="mt-1 flex flex-wrap gap-1 rounded-full border border-border bg-muted/50 p-1">
                {[4, 8, 12, 24, 48].map((h) => {
                  const isActive = autoAssignHours === h;
                  return (
                    <button
                      key={h}
                      onClick={() => setAutoAssignHours(h)}
                      className={`rounded-full px-3 py-1 text-xs font-medium tabular-nums transition-colors ${
                        isActive
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {h}h
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {lastUpdatedBy && (
            <p className="text-xs text-muted-foreground">
              Last updated by{" "}
              <span className="font-medium text-foreground">
                {lastUpdatedBy}
              </span>
            </p>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-brand-600 hover:bg-brand-700 text-white"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </section>

      {/* ── Document Templates Section (Legal + Admin only) ── */}
      {isLegal && (
        <section>
          <SectionLabel icon={FileText}>Document Templates</SectionLabel>
          <div className="mt-3 rounded-xl border bg-card p-4 md:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Create reusable document templates with placeholder fields.
                Use <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">{"{{placeholderName}}"}</code> syntax for dynamic fields.
              </p>
              <Button
                onClick={openCreateModal}
                className="bg-brand-600 hover:bg-brand-700 text-white shrink-0 ml-4"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Template
              </Button>
            </div>

            {templatesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No templates yet. Create your first template to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((t) => {
                  const isExpanded = expandedId === t.id;
                  const placeholderCount = (t.placeholders || []).length;
                  return (
                    <div
                      key={t.id}
                      className="rounded-lg border border-border bg-background"
                    >
                      {/* Card header */}
                      <div className="flex items-start gap-3 p-3">
                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : t.id)
                          }
                          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-medium text-foreground">
                              {t.name}
                            </h3>
                            {t.processType && (
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {t.processType.name}
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className="text-[10px] tabular-nums"
                            >
                              {placeholderCount} field
                              {placeholderCount !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                          {t.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                              {t.description}
                            </p>
                          )}
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            Created by {t.createdBy.name} on{" "}
                            {new Date(t.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openFillModal(t)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/30 transition-colors"
                            title="Use Template"
                          >
                            <Play className="h-3 w-3" />
                            Use
                          </button>
                          <button
                            onClick={() => openEditModal(t)}
                            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="border-t border-border px-3 pb-3 pt-2">
                          {(t.placeholders || []).length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-1">
                              {(t.placeholders as string[]).map((p) => (
                                <Badge
                                  key={p}
                                  variant="secondary"
                                  className="text-[10px] font-mono"
                                >
                                  {`{{${p}}}`}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono bg-muted/30 rounded-lg p-3 max-h-64 overflow-y-auto">
                            {t.content}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══ Create / Edit Template Modal ═══ */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              {editingTemplate ? "Edit Template" : "Create Template"}
            </h2>
            <button
              onClick={() => setShowCreateModal(false)}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-foreground">Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Power of Attorney for QKB Registration"
              className="mt-1 w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-foreground">
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <input
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Brief description of this template"
              className="mt-1 w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>

          {/* Process link */}
          <div>
            <label className="text-sm font-medium text-foreground">
              Link to Process{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <select
              value={formProcessTypeId}
              onChange={(e) => setFormProcessTypeId(e.target.value)}
              className="mt-1 w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="">None</option>
              {processes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium text-foreground">
              Template Content
            </label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-1">
              Use <code className="rounded bg-muted px-1 py-0.5 font-mono">{"{{placeholderName}}"}</code> for dynamic fields
            </p>
            <Textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder={"POWER OF ATTORNEY\n\nI, {{founderName}}, holder of ID/Passport No. {{idNumber}}..."}
              className="font-mono text-xs min-h-48 resize-y"
              rows={12}
            />
          </div>

          {/* Detected placeholders */}
          {detectedPlaceholders.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Detected placeholders:
              </p>
              <div className="flex flex-wrap gap-1">
                {detectedPlaceholders.map((p) => (
                  <Badge
                    key={p}
                    variant="secondary"
                    className="text-[10px] font-mono"
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrEdit}
              disabled={formSaving}
              className="bg-brand-600 hover:bg-brand-700 text-white"
              size="sm"
            >
              {formSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              {editingTemplate ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ═══ Fill / Use Template Modal ═══ */}
      <Modal
        open={!!fillTemplate}
        onClose={() => setFillTemplate(null)}
      >
        {fillTemplate && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                Use Template: {fillTemplate.name}
              </h2>
              <button
                onClick={() => setFillTemplate(null)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Form fields */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Fill in values
                </p>
                {(fillTemplate.placeholders || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    This template has no placeholder fields.
                  </p>
                ) : (
                  (fillTemplate.placeholders as string[]).map((p) => (
                    <div key={p}>
                      <label className="text-xs font-medium text-foreground">
                        {p.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                      </label>
                      <input
                        type="text"
                        value={fillValues[p] || ""}
                        onChange={(e) =>
                          setFillValues((prev) => ({
                            ...prev,
                            [p]: e.target.value,
                          }))
                        }
                        placeholder={p}
                        className="mt-0.5 w-full h-8 rounded-lg border border-border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Right: Live preview */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Live Preview
                </p>
                <pre className="whitespace-pre-wrap text-xs font-mono bg-muted/30 rounded-lg p-3 max-h-80 overflow-y-auto border border-border">
                  {filledPreview}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                onClick={copyToClipboard}
                size="sm"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy to Clipboard
              </Button>
              <Button
                onClick={downloadAsText}
                className="bg-brand-600 hover:bg-brand-700 text-white"
                size="sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Download as Text
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
