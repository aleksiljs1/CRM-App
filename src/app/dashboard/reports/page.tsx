"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Activity,
  TrendingUp,
  FileText,
  Download,
  PieChart,
  LineChart,
  type LucideIcon,
} from "lucide-react";

// ─── Inline section primitives (matches /dashboard/hr/ pattern) ─────────────

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

// ─── Page ───────────────────────────────────────────────────────────────────

type PeriodFilter = "7d" | "30d" | "90d" | "ytd" | "all";

export default function ReportsPage() {
  const [period, setPeriod] = useState<PeriodFilter>("30d");

  const periodTabs: { key: PeriodFilter; label: string }[] = [
    { key: "7d", label: "7 days" },
    { key: "30d", label: "30 days" },
    { key: "90d", label: "90 days" },
    { key: "ytd", label: "YTD" },
    { key: "all", label: "All time" },
  ];

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-brand-700 dark:text-brand-400">
            Reports
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Insights, trends and exports across your workspace
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <span className="inline-flex items-center rounded-full border border-brand-200/60 bg-brand-100/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:border-brand-800/50 dark:bg-brand-900/40 dark:text-brand-300">
            Analytics
          </span>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── Period filter pills ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap gap-1 rounded-full border border-border bg-muted/50 p-1">
          {periodTabs.map((tab) => {
            const isActive = period === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setPeriod(tab.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Overview KPI strip ─────────────────────────────────────────── */}
      <section>
        <SectionLabel icon={Activity}>Overview</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xs">
            <span className="flex size-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
              <BarChart3 className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-bold tabular-nums leading-tight text-foreground">
                —
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                Reports generated
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xs">
            <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <TrendingUp className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-bold tabular-nums leading-tight text-foreground">
                —
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                Growth vs prior period
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xs">
            <span className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <Activity className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-bold tabular-nums leading-tight text-foreground">
                —
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                Active workflows
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xs">
            <span className="flex size-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
              <FileText className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-bold tabular-nums leading-tight text-foreground">
                —
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                Saved exports
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trends ─────────────────────────────────────────────────────── */}
      <section>
        <SectionLabel icon={LineChart}>Trends</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-4 md:p-5 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Volume over time
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Activity by day for the selected window
                </p>
              </div>
            </div>
            <div className="mt-6 flex h-44 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
              Chart will render here
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 md:p-5 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Breakdown
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Distribution across categories
                </p>
              </div>
              <PieChart className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-6 flex h-44 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
              Chart will render here
            </div>
          </div>
        </div>
      </section>

      {/* ── Available reports ──────────────────────────────────────────── */}
      <section>
        <SectionLabel icon={FileText}>Available reports</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Team activity",
              subtitle: "Tasks, emails and chats per person",
            },
            {
              title: "Client portfolio",
              subtitle: "Status breakdown and engagement",
            },
            {
              title: "SLA performance",
              subtitle: "Response and resolution times",
            },
          ].map((r) => (
            <div
              key={r.title}
              className="group flex items-center gap-3 rounded-xl border bg-card p-4 md:p-5 shadow-xs transition-colors hover:border-brand-300/60"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                <FileText className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {r.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.subtitle}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 gap-1.5"
              >
                <Download className="size-3.5" />
                Export
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
