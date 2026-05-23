"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  Building2,
  FolderOpen,
  Download,
} from "lucide-react";
import { exportToExcel } from "@/lib/export";

// ── Types ───────────────────────────────────────────────────────────────────

interface ClientRow {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  phone: string | null;
  industry: string | null;
  status: "LEAD" | "ACTIVE" | "INACTIVE";
  assignedToId: string | null;
  assignedTo: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string | null;
}

// ── Constants ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["LEAD", "ACTIVE", "INACTIVE"] as const;

const statusColors: Record<string, string> = {
  LEAD: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
  ACTIVE:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800",
  INACTIVE:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800",
};

// ── Client Modal ────────────────────────────────────────────────────────────

function ClientModal({
  client,
  employees,
  onClose,
  onSaved,
}: {
  client: ClientRow | null;
  employees: Employee[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!client;
  const [companyName, setCompanyName] = useState(client?.companyName || "");
  const [contactName, setContactName] = useState(client?.contactName || "");
  const [contactEmail, setContactEmail] = useState(client?.contactEmail || "");
  const [phone, setPhone] = useState(client?.phone || "");
  const [industry, setIndustry] = useState(client?.industry || "");
  const [status, setStatus] = useState(client?.status || "LEAD");
  const [assignedToId, setAssignedToId] = useState(
    client?.assignedToId || ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !contactName.trim() || !contactEmail.trim())
      return;

    setSubmitting(true);
    setFormError("");

    try {
      const method = isEdit ? "PATCH" : "POST";
      const payload: Record<string, unknown> = {
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        phone: phone.trim() || null,
        industry: industry.trim() || null,
        status,
        assignedToId: assignedToId || null,
      };

      if (isEdit) payload.id = client!.id;

      const res = await fetch("/api/admin/clients", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Operation failed");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setFormError("Operation failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-card shadow-xl">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              {isEdit ? "Edit Client" : "Add Client"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {formError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
              {formError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/80">
                Company Name *
              </label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corp"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/80">
                Contact Name *
              </label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Jane Doe"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/80">
                Contact Email *
              </label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="jane@acme.com"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/80">
                Phone
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+355 69 123 4567"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/80">
                Industry
              </label>
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Technology, Finance"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/80">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/80">
                Assigned Employee
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                submitting ||
                !companyName.trim() ||
                !contactName.trim() ||
                !contactEmail.trim()
              }
              className="bg-brand-600 text-white hover:bg-brand-700"
            >
              {submitting ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : isEdit ? (
                <Pencil className="mr-1 h-4 w-4" />
              ) : (
                <Building2 className="mr-1 h-4 w-4" />
              )}
              {isEdit ? "Save Changes" : "Create Client"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirmation Modal ───────────────────────────────────────────────

function DeleteConfirmModal({
  clientName,
  onConfirm,
  onCancel,
}: {
  clientName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl">
        <h3 className="text-lg font-bold text-foreground">Delete Client</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">{clientName}</span>?
          This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null);

  // Delete
  const [deletingClient, setDeletingClient] = useState<ClientRow | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function fetchClients() {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);
      if (filterIndustry) params.set("industry", filterIndustry);

      const res = await fetch(`/api/admin/clients?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setClients(data.clients);
      setEmployees(data.employees);
      setIndustries(data.industries);
    } catch {
      setError("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterStatus, filterIndustry]);

  async function handleDelete() {
    if (!deletingClient) return;
    try {
      const res = await fetch(
        `/api/admin/clients?id=${deletingClient.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed");
      showToast(`${deletingClient.companyName} deleted`);
      setDeletingClient(null);
      fetchClients();
    } catch {
      showToast("Failed to delete client");
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600 dark:text-brand-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const statusCounts = {
    LEAD: clients.filter((c) => c.status === "LEAD").length,
    ACTIVE: clients.filter((c) => c.status === "ACTIVE").length,
    INACTIVE: clients.filter((c) => c.status === "INACTIVE").length,
  };

  return (
    <div className="space-y-6 p-3 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-brand-700 dark:text-brand-400">
            Client Management
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {clients.length} clients &middot; {statusCounts.ACTIVE} active
            &middot; {statusCounts.LEAD} leads &middot;{" "}
            {statusCounts.INACTIVE} inactive
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={async () => {
            try {
              await exportToExcel("clients");
            } catch {
              // silent
            }
          }}
        >
          <Download className="h-4 w-4" />
          Export Clients
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col flex-wrap items-stretch gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-xs md:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search company or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 md:w-auto"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filterIndustry}
          onChange={(e) => setFilterIndustry(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 md:w-auto"
        >
          <option value="">All Industries</option>
          {industries.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <FolderOpen className="h-6 w-6 text-muted-foreground" />
            </span>
            <p className="mt-3 text-sm font-medium text-foreground">
              No clients found
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your filters or add a new client.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] md:min-w-[900px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Contact
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left font-medium text-muted-foreground">
                    Phone
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left font-medium text-muted-foreground">
                    Industry
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Assigned To
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {client.companyName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {client.contactName}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-muted-foreground">
                      {client.contactEmail}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-muted-foreground">
                      {client.phone || "\u2014"}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-muted-foreground">
                      {client.industry || "\u2014"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${statusColors[client.status] || ""}`}
                      >
                        {client.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {client.assignedTo?.name || "\u2014"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingClient(client);
                            setModalOpen(true);
                          }}
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingClient(client)}
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Client Modal */}
      {modalOpen && (
        <ClientModal
          client={editingClient}
          employees={employees}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            fetchClients();
            showToast(editingClient ? "Client updated" : "Client created");
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingClient && (
        <DeleteConfirmModal
          clientName={deletingClient.companyName}
          onConfirm={handleDelete}
          onCancel={() => setDeletingClient(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-white shadow-lg animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
