"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  Plus,
  Send,
  Building2,
  Copy,
  X,
  Loader2,
  Download,
} from "lucide-react";
import { exportToExcel } from "@/lib/export";

// ─── Types ──────────────────────────────────────────────────────────────────

type ClientStatus = "LEAD" | "PROSPECT" | "ACTIVE" | "CHURNED";

interface ClientRow {
  id: string;
  name: string;
  companyName: string | null;
  status: ClientStatus;
  email: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const statusBadgeClass: Record<ClientStatus, string> = {
  LEAD: "bg-amber-100 text-amber-700 border border-amber-200/60 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800/50",
  PROSPECT:
    "bg-violet-100 text-violet-700 border border-violet-200/60 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800/50",
  ACTIVE:
    "bg-emerald-100 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800/50",
  CHURNED:
    "bg-muted text-muted-foreground border border-border",
};

const statusLabel: Record<ClientStatus, string> = {
  LEAD: "Lead",
  PROSPECT: "Prospect",
  ACTIVE: "Active",
  CHURNED: "Churned",
};

// ─── Page ───────────────────────────────────────────────────────────────────

type StatusFilter = "all" | ClientStatus;

export default function ClientsPage() {
  // Presentational scaffold — when wired to the API the existing handler
  // signatures will replace these local state setters.
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const clients: ClientRow[] = [];

  // Adding / inviting clients is a management responsibility. SENIOR and
  // ASSOCIATE can browse the portfolio but not create new accounts.
  const { data: session } = useSession();
  const role = session?.user?.role;
  const canManageClients =
    role === "ADMIN" || role === "PARTNER" || role === "MANAGER";

  const [inviteOpen, setInviteOpen] = useState(false);

  const filterTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: 0 },
    { key: "LEAD", label: "Leads", count: 0 },
    { key: "PROSPECT", label: "Prospects", count: 0 },
    { key: "ACTIVE", label: "Active", count: 0 },
    { key: "CHURNED", label: "Churned", count: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-brand-700 dark:text-brand-400">
            Clients
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Your portfolio of accounts and contacts
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <span className="inline-flex items-center rounded-full border border-brand-200/60 bg-brand-100/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:border-brand-800/50 dark:bg-brand-900/40 dark:text-brand-300">
            Portfolio
          </span>
          {canManageClients && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={async () => {
                  try {
                    await exportToExcel("clients");
                    toast.success("Excel exported successfully");
                  } catch {
                    toast.error("Export failed");
                  }
                }}
              >
                <Download className="size-4" />
                Export Clients
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setInviteOpen(true)}
              >
                <Send className="size-4" />
                Invite Client
              </Button>
              <Button
                size="sm"
                className="gap-2 bg-brand-600 hover:bg-brand-700 text-white"
                onClick={() => setInviteOpen(true)}
              >
                <Plus className="size-4" />
                Add Client
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Filter row ────────────────────────────────────────────────── */}
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
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50"
          />
        </div>
      </div>

      {/* ── Client list ───────────────────────────────────────────────── */}
      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-20 text-center shadow-xs">
          <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
            <Users className="size-6" />
          </span>
          <p className="mt-3 text-sm font-medium text-foreground">
            No clients yet
          </p>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            {canManageClients
              ? "Use the Add Client or Invite Client button above to start building your portfolio."
              : "Your manager will add clients to the portfolio."}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <li
              key={c.id}
              className="group flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xs transition-shadow hover:shadow-md"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                {initialsOf(c.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {c.name}
                </p>
                {c.companyName && (
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <Building2 className="size-3 shrink-0" />
                    {c.companyName}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusBadgeClass[c.status]}`}
              >
                {statusLabel[c.status]}
              </span>
            </li>
          ))}
        </ul>
      )}

      {inviteOpen && (
        <InviteClientModal onClose={() => setInviteOpen(false)} />
      )}
    </div>
  );
}

// ─── Invite Client Modal ────────────────────────────────────────────────────
// Posts to the existing /api/clients/invite endpoint (creates a Client + a
// portal User + temp password). On success shows the credentials so the
// manager can hand them to the client out-of-band.

function InviteClientModal({ onClose }: { onClose: () => void }) {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !contactName.trim() || !contactEmail.trim()) {
      setError("Company, contact name, and email are required");
      return;
    }
    setSubmitting(true);
    setError("");
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
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          (data as { error?: string }).error || "Failed to create client"
        );
        return;
      }
      const creds = (data as {
        credentials?: { email: string; password: string };
      }).credentials;
      if (creds) {
        setCredentials(creds);
        toast.success("Client created");
      } else {
        setError("Server did not return credentials");
      }
    } catch {
      setError("Failed to create client");
    } finally {
      setSubmitting(false);
    }
  }

  function copyCreds() {
    if (!credentials) return;
    const text = `Email: ${credentials.email}\nTemporary password: ${credentials.password}`;
    navigator.clipboard.writeText(text).then(
      () => toast.success("Credentials copied"),
      () => toast.error("Couldn't copy")
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            {credentials ? "Client created" : "Add a client"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        {credentials ? (
          <div className="space-y-4 p-5">
            <p className="text-sm text-muted-foreground">
              Share these credentials with the client. They&apos;ll be asked to
              change the password on first login.
            </p>
            <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </span>
                <p className="mt-0.5 font-mono text-sm text-foreground break-all">
                  {credentials.email}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Temporary password
                </span>
                <p className="mt-0.5 font-mono text-sm text-foreground">
                  {credentials.password}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyCreds}
                className="gap-2"
              >
                <Copy className="size-3.5" />
                Copy
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onClose}
                className="bg-brand-600 text-white hover:bg-brand-700"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 p-5">
            <Field
              id="add-company"
              label="Company name *"
              value={companyName}
              onChange={setCompanyName}
              placeholder="Acme LLC"
              autoFocus
            />
            <Field
              id="add-contact-name"
              label="Contact name *"
              value={contactName}
              onChange={setContactName}
              placeholder="Jane Doe"
            />
            <Field
              id="add-contact-email"
              label="Contact email *"
              type="email"
              value={contactEmail}
              onChange={setContactEmail}
              placeholder="jane@acme.com"
            />
            <Field
              id="add-phone"
              label="Phone (optional)"
              value={phone}
              onChange={setPhone}
              placeholder="+355 ..."
            />
            <Field
              id="add-industry"
              label="Industry (optional)"
              value={industry}
              onChange={setIndustry}
              placeholder="Manufacturing"
            />

            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="gap-2 bg-brand-600 text-white hover:bg-brand-700"
              >
                {submitting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Plus className="size-3.5" />
                )}
                {submitting ? "Creating…" : "Create client"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium text-foreground"
      >
        {label}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="bg-muted/30"
      />
    </div>
  );
}
