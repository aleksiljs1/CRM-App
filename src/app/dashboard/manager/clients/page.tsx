"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Mail,
  CheckSquare,
  FileText,
  Clock,
  Building2,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  Copy,
} from "lucide-react";

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

interface ClientData {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  phone: string | null;
  industry: string | null;
  status: "LEAD" | "ACTIVE" | "INACTIVE";
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: string; name: string; email: string; role: string } | null;
  submissions: { id: string; status: string; processType: { id: string; name: string; department: string } }[];
  tasks: { id: string; status: string; priority: string; deadline: string | null }[];
  emails: { id: string; isIncoming: boolean; isReplied: boolean; createdAt: string }[];
}

interface AssignableUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}

function ClientCard({ client }: { client: ClientData }) {
  const activeTasks = client.tasks.filter(
    (t) => t.status !== "COMPLETED" && t.status !== "APPROVED"
  ).length;
  const lastEmail = client.emails[0];

  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground leading-tight">
          {client.companyName}
        </h4>
        {client.industry && (
          <span className="ml-2 inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {client.industry}
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{client.contactName}</p>
      <p className="mb-3 text-xs text-muted-foreground">{client.contactEmail}</p>

      <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Building2 className="h-3 w-3" />
        <span>
          {client.assignedTo ? client.assignedTo.name : "Unassigned"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1 tabular-nums" title="Active tasks">
          <CheckSquare className="h-3 w-3" />
          {activeTasks}
        </span>
        <span className="flex items-center gap-1 tabular-nums" title="Submissions">
          <FileText className="h-3 w-3" />
          {client.submissions.length}
        </span>
        {lastEmail && (
          <span className="flex items-center gap-1" title="Last email">
            <Mail className="h-3 w-3" />
            {timeAgo(lastEmail.createdAt)}
          </span>
        )}
      </div>

      <div className="mt-3 border-t border-border pt-2 text-[10px] text-muted-foreground flex items-center gap-1">
        <Clock className="h-2.5 w-2.5" />
        Created {timeAgo(client.createdAt)}
      </div>
    </div>
  );
}

const COLUMNS = [
  {
    status: "LEAD" as const,
    label: "Leads",
    borderColor: "border-t-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950",
    textColor: "text-amber-700 dark:text-amber-300",
    icon: Users,
    cardBg: "bg-amber-500",
  },
  {
    status: "ACTIVE" as const,
    label: "Active",
    borderColor: "border-t-brand-500",
    bgColor: "bg-brand-50 dark:bg-brand-950/40",
    textColor: "text-brand-700 dark:text-brand-300",
    icon: UserCheck,
    cardBg: "bg-brand-600",
  },
  {
    status: "INACTIVE" as const,
    label: "Inactive",
    borderColor: "border-t-muted-foreground/50",
    bgColor: "bg-muted/50",
    textColor: "text-muted-foreground",
    icon: UserX,
    cardBg: "bg-muted-foreground/70",
  },
];

// ─── Invite Client Modal ────────────────────────────────────────────────────

function InviteClientModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [assignees, setAssignees] = useState<AssignableUser[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  // Load assignable users (ADMIN/PARTNER/MANAGER) from /api/chat/users.
  // That endpoint excludes CLIENT users; we further filter to manager-tier roles client-side.
  useEffect(() => {
    let cancelled = false;
    async function loadAssignees() {
      try {
        const res = await fetch("/api/chat/users");
        if (!res.ok) return;
        const data: { users: AssignableUser[] } = await res.json();
        if (cancelled) return;
        const filtered = (data.users ?? []).filter((u) =>
          ["ADMIN", "PARTNER", "MANAGER"].includes(u.role)
        );
        setAssignees(filtered);
      } catch {
        // non-fatal — the field is optional
      }
    }
    loadAssignees();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !companyName.trim() ||
      !contactName.trim() ||
      !contactEmail.trim()
    ) {
      setFormError("Company name, contact name, and contact email are required");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/clients/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          phone: phone.trim() || undefined,
          industry: industry.trim() || undefined,
          assignedToId: assignedToId || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(
          (data as { error?: string }).error || "Failed to invite client"
        );
        return;
      }
      const creds = (data as { credentials?: { email: string; password: string } })
        .credentials;
      if (creds) {
        setCredentials(creds);
      } else {
        setFormError("Server did not return credentials");
      }
    } catch {
      setFormError("Failed to invite client");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyToClipboard(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Failed to copy");
    }
  }

  function handleDone() {
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {credentials ? (
          // ── Credentials view ──────────────────────────────────────────
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">
                Client account created
              </h2>
              <button
                type="button"
                onClick={handleDone}
                className="p-1 hover:bg-muted rounded"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-start gap-3 mb-5 p-3 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-300">
                The client&apos;s sign-in credentials are shown below. They
                will not be visible again after you close this dialog.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="cred-email" className="mb-1 block">
                  Email
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="cred-email"
                    readOnly
                    value={credentials.email}
                    onFocus={(e) => e.currentTarget.select()}
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(credentials.email, "Email")}
                    aria-label="Copy email"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="cred-password" className="mb-1 block">
                  Temporary password
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="cred-password"
                    readOnly
                    value={credentials.password}
                    onFocus={(e) => e.currentTarget.select()}
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      copyToClipboard(credentials.password, "Password")
                    }
                    aria-label="Copy password"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Share these with the client. They can sign in at{" "}
                <span className="font-mono">/login</span>. Recommend they
                change their password after first sign-in.
              </p>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                type="button"
                onClick={handleDone}
                className="bg-brand-600 hover:bg-brand-700 text-white"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          // ── Form view ─────────────────────────────────────────────────
          <form onSubmit={handleSubmit} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">
                Invite a new client
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 hover:bg-muted rounded"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="invite-company" className="mb-1 block">
                  Company name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="invite-company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Holdings sh.p.k."
                  required
                />
              </div>

              <div>
                <Label htmlFor="invite-contact" className="mb-1 block">
                  Contact name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="invite-contact"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="invite-email" className="mb-1 block">
                  Contact email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="jane@acme.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="invite-phone" className="mb-1 block">
                  Phone
                </Label>
                <Input
                  id="invite-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+355 ..."
                />
              </div>

              <div>
                <Label htmlFor="invite-industry" className="mb-1 block">
                  Industry
                </Label>
                <Input
                  id="invite-industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Retail, Manufacturing, ..."
                />
              </div>

              <div>
                <Label htmlFor="invite-assignee" className="mb-1 block">
                  Assign to
                </Label>
                <select
                  id="invite-assignee"
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="">Unassigned</option>
                  {assignees.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Optional. Only ADMIN, PARTNER, and MANAGER users are listed.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
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
                className="bg-brand-600 hover:bg-brand-700 text-white"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Plus className="w-4 h-4 mr-1" />
                )}
                Create client
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

type StatusFilter = "ALL" | "LEAD" | "ACTIVE" | "INACTIVE";

export default function ClientPipelinePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const dept = session?.user?.department || null;
  const deptDisplayName = getDeptName(dept);

  const [clients, setClients] = useState<ClientData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients);
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const grouped = useMemo(() => {
    return {
      LEAD: filtered.filter((c) => c.status === "LEAD"),
      ACTIVE: filtered.filter((c) => c.status === "ACTIVE"),
      INACTIVE: filtered.filter((c) => c.status === "INACTIVE"),
    };
  }, [filtered]);

  const filterTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: filtered.length },
    { key: "LEAD", label: "Leads", count: grouped.LEAD.length },
    { key: "ACTIVE", label: "Active", count: grouped.ACTIVE.length },
    { key: "INACTIVE", label: "Inactive", count: grouped.INACTIVE.length },
  ];

  // Decide which COLUMNS to display based on the segmented filter.
  const visibleColumns =
    statusFilter === "ALL"
      ? COLUMNS
      : COLUMNS.filter((col) => col.status === statusFilter);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading client pipeline...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 p-3 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-brand-700 dark:text-brand-400">
            Client Pipeline
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Track clients from first contact to active engagement
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <span className="inline-flex items-center rounded-full border border-brand-200/60 bg-brand-100/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:border-brand-800/50 dark:bg-brand-900/40 dark:text-brand-300">
            {deptDisplayName}
          </span>
          <Button
            onClick={() => setShowInvite(true)}
            className="w-full md:w-auto bg-brand-600 hover:bg-brand-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            New client
          </Button>
        </div>
      </div>

      {/* Summary Cards — restyled as the small-stat strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {COLUMNS.map((col) => {
          const count = grouped[col.status].length;
          return (
            <div
              key={col.status}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xs"
            >
              <span
                className={`flex size-9 items-center justify-center rounded-lg ${col.bgColor} ${col.textColor}`}
              >
                <col.icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-base font-bold tabular-nums leading-tight text-foreground">
                  {count}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {col.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter pill bar + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap gap-1 rounded-full border border-border bg-muted/50 p-1">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1 text-[10px] tabular-nums ${
                    isActive
                      ? "font-semibold text-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  · {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by company or contact name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50"
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div
        className={`grid min-h-0 flex-1 grid-cols-1 gap-4 ${visibleColumns.length === 1 ? "" : "lg:grid-cols-3"}`}
      >
        {visibleColumns.map((col) => {
          const items = grouped[col.status];
          return (
            <div
              key={col.status}
              className={`flex flex-col rounded-xl border border-t-4 ${col.borderColor} bg-card shadow-xs`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${col.bgColor} ${col.textColor}`}
                  >
                    {col.label}
                  </span>
                </div>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {items.length}
                </span>
              </div>

              {/* Column body */}
              <div
                className="flex-1 space-y-3 overflow-y-auto px-3 pb-3"
                style={{ maxHeight: "calc(100vh - 380px)" }}
              >
                {items.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                    No clients
                  </div>
                ) : (
                  items.map((client) => (
                    <ClientCard key={client.id} client={client} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showInvite && (
        <InviteClientModal
          onClose={() => setShowInvite(false)}
          onCreated={() => {
            fetchClients();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
