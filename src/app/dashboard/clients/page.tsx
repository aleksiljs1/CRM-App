"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  Plus,
  Send,
  Building2,
  Sparkles,
} from "lucide-react";

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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Send className="size-4" />
              Invite Client
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-brand-600 hover:bg-brand-700 text-white"
            >
              <Plus className="size-4" />
              Add Client
            </Button>
          </div>
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
            Add a client or send an invitation to start building your portfolio.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Button
              size="sm"
              className="gap-2 bg-brand-600 hover:bg-brand-700 text-white"
            >
              <Plus className="size-4" />
              Add Client
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Sparkles className="size-4 text-brand-600 dark:text-brand-400" />
              Import from email
            </Button>
          </div>
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
    </div>
  );
}
