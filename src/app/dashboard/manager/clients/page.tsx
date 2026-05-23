"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-start justify-between">
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

      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
        <Building2 className="h-3 w-3" />
        <span>
          {client.assignedTo ? client.assignedTo.name : "Unassigned"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1" title="Active tasks">
          <CheckSquare className="h-3 w-3" />
          {activeTasks}
        </span>
        <span className="flex items-center gap-1" title="Submissions">
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

      <div className="mt-3 border-t pt-2 text-[10px] text-muted-foreground flex items-center gap-1">
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

export default function ClientPipelinePage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading client pipeline...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Client Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Track clients from first contact to active engagement
          </p>
        </div>
        <Button
          onClick={() => setShowInvite(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          New client
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {COLUMNS.map((col) => {
          const count = grouped[col.status].length;
          return (
            <Card key={col.status} className="relative overflow-hidden">
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${col.cardBg}`}
                >
                  <col.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {col.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by company or contact name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Kanban Board */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = grouped[col.status];
          return (
            <div
              key={col.status}
              className={`flex flex-col rounded-lg border border-t-4 ${col.borderColor} bg-muted/30`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${col.bgColor} ${col.textColor}`}
                  >
                    {col.label}
                  </span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {items.length}
                </span>
              </div>

              {/* Column body */}
              <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-3" style={{ maxHeight: "calc(100vh - 380px)" }}>
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
