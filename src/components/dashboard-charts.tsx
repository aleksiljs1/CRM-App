"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TasksByTeamData {
  name: string;
  tasks: number;
}

function truncateLabel(value: string): string {
  if (typeof value !== "string") return value;
  return value.length > 10 ? `${value.slice(0, 10)}…` : value;
}

export function TasksByTeamChart({ data }: { data: TasksByTeamData[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
        barCategoryGap="22%"
      >
        <defs>
          <linearGradient id="brandBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-400)" />
            <stop offset="100%" stopColor="var(--color-brand-600)" />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickFormatter={truncateLabel}
          angle={-15}
          textAnchor="end"
          interval={0}
          height={50}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          axisLine={{ stroke: "var(--border)" }}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
          contentStyle={{
            backgroundColor: "var(--color-bg-card, var(--background))",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "13px",
            color: "var(--foreground)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        />
        <Bar dataKey="tasks" fill="url(#brandBar)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Tasks by Status — horizontal stacked bar ──────────────────────────────

interface TasksByStatusData {
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "APPROVED";
  count: number;
}

interface TasksByStatusChartProps {
  data: TasksByStatusData[];
  total: number;
}

// Colors mirror the canonical task-status palette from
// src/app/dashboard/hr/tasks/page.tsx so cues stay consistent across the app:
//   TODO → muted/slate · IN_PROGRESS → blue · REVIEW → amber · APPROVED → teal
const STATUS_META: Record<
  TasksByStatusData["status"],
  { label: string; bar: string; dot: string; text: string }
> = {
  TODO: {
    label: "To do",
    bar: "bg-slate-400 dark:bg-slate-500",
    dot: "bg-slate-400 dark:bg-slate-500",
    text: "text-slate-700 dark:text-slate-300",
  },
  IN_PROGRESS: {
    label: "In progress",
    bar: "bg-blue-500 dark:bg-blue-400",
    dot: "bg-blue-500 dark:bg-blue-400",
    text: "text-blue-700 dark:text-blue-300",
  },
  REVIEW: {
    label: "In review",
    bar: "bg-amber-500 dark:bg-amber-400",
    dot: "bg-amber-500 dark:bg-amber-400",
    text: "text-amber-700 dark:text-amber-300",
  },
  APPROVED: {
    label: "Approved",
    bar: "bg-teal-500 dark:bg-teal-400",
    dot: "bg-teal-500 dark:bg-teal-400",
    text: "text-teal-700 dark:text-teal-300",
  },
};

export function TasksByStatusChart({ data, total }: TasksByStatusChartProps) {
  return (
    <div className="space-y-6 pt-4">
      {/* Total on top */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums text-foreground">
          {total}
        </span>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          open tasks
        </span>
      </div>

      {/* The stacked bar */}
      <div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {data.map((item) => {
            const widthPct = total > 0 ? (item.count / total) * 100 : 0;
            if (widthPct === 0) return null;
            return (
              <div
                key={item.status}
                className={`h-full ${STATUS_META[item.status].bar} transition-[width] duration-300`}
                style={{ width: `${widthPct}%` }}
                title={`${STATUS_META[item.status].label}: ${item.count}`}
              />
            );
          })}
        </div>
      </div>

      {/* Legend / breakdown — grid of 4 rows showing label + count + share */}
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {data.map((item) => {
          const meta = STATUS_META[item.status];
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <li
              key={item.status}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className={`size-2 shrink-0 rounded-full ${meta.dot}`} />
                <span className="truncate text-xs font-medium text-foreground">
                  {meta.label}
                </span>
              </div>
              <div className="flex shrink-0 items-baseline gap-1.5">
                <span
                  className={`text-sm font-bold tabular-nums ${meta.text}`}
                >
                  {item.count}
                </span>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  ({pct}%)
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
