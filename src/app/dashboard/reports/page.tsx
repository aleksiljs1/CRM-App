import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Activity,
  Users,
  LineChart,
  Layers,
  Building2,
  Clock,
  Sparkles,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { EmailsAreaChart, TasksAreaChart } from "@/components/dashboard/activity-charts";
import { TasksByTeamChart, TasksByStatusChart } from "@/components/dashboard-charts";

// ─── Domain constants ───────────────────────────────────────────────────────

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

const ALL_DEPTS = [
  "AUDIT",
  "ACCOUNTING_TAX",
  "BOOKKEEPING_PAYROLL",
  "LEGAL",
  "ADVISORY",
  "HR",
  "MARKETING",
  "FINANCE",
] as const;

const PRIORITY_META: Record<
  string,
  { label: string; bar: string; dot: string; text: string }
> = {
  URGENT: {
    label: "Urgent",
    bar: "bg-red-500 dark:bg-red-400",
    dot: "bg-red-500 dark:bg-red-400",
    text: "text-red-700 dark:text-red-300",
  },
  HIGH: {
    label: "High",
    bar: "bg-orange-500 dark:bg-orange-400",
    dot: "bg-orange-500 dark:bg-orange-400",
    text: "text-orange-700 dark:text-orange-300",
  },
  MEDIUM: {
    label: "Medium",
    bar: "bg-amber-500 dark:bg-amber-400",
    dot: "bg-amber-500 dark:bg-amber-400",
    text: "text-amber-700 dark:text-amber-300",
  },
  LOW: {
    label: "Low",
    bar: "bg-slate-400 dark:bg-slate-500",
    dot: "bg-slate-400 dark:bg-slate-500",
    text: "text-slate-700 dark:text-slate-300",
  },
};

const SUBMISSION_META: Record<
  string,
  { label: string; bar: string; dot: string; text: string }
> = {
  INCOMPLETE: {
    label: "Incomplete",
    bar: "bg-slate-400 dark:bg-slate-500",
    dot: "bg-slate-400 dark:bg-slate-500",
    text: "text-slate-700 dark:text-slate-300",
  },
  COMPLETE: {
    label: "Complete",
    bar: "bg-blue-500 dark:bg-blue-400",
    dot: "bg-blue-500 dark:bg-blue-400",
    text: "text-blue-700 dark:text-blue-300",
  },
  UNDER_REVIEW: {
    label: "Under review",
    bar: "bg-amber-500 dark:bg-amber-400",
    dot: "bg-amber-500 dark:bg-amber-400",
    text: "text-amber-700 dark:text-amber-300",
  },
  APPROVED: {
    label: "Approved",
    bar: "bg-emerald-500 dark:bg-emerald-400",
    dot: "bg-emerald-500 dark:bg-emerald-400",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  REJECTED: {
    label: "Rejected",
    bar: "bg-red-500 dark:bg-red-400",
    dot: "bg-red-500 dark:bg-red-400",
    text: "text-red-700 dark:text-red-300",
  },
};

// ─── Date helpers ───────────────────────────────────────────────────────────

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildLastNDays(n: number): { key: string; label: string }[] {
  const days: { key: string; label: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      key: dayKey(d),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }
  return days;
}

function bucketByDay(
  dates: Date[],
  days: { key: string; label: string }[],
): { day: string; value: number }[] {
  const counts = new Map<string, number>(days.map((d) => [d.key, 0]));
  for (const date of dates) {
    const k = dayKey(date);
    if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return days.map((d) => ({ day: d.label, value: counts.get(d.key) ?? 0 }));
}

function buildLast12Weeks(): { weekStart: Date; label: string }[] {
  const weeks: { weekStart: Date; label: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  const mondayOffset = (dayOfWeek + 6) % 7;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - mondayOffset);
  for (let i = 11; i >= 0; i--) {
    const ws = new Date(thisMonday);
    ws.setDate(thisMonday.getDate() - i * 7);
    weeks.push({
      weekStart: ws,
      label: ws.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }
  return weeks;
}

function bucketByWeek(
  dates: Date[],
  weeks: { weekStart: Date; label: string }[],
): { day: string; value: number }[] {
  const result = weeks.map((w) => ({
    day: w.label,
    value: 0,
    start: w.weekStart.getTime(),
  }));
  for (const date of dates) {
    const t = date.getTime();
    for (let i = result.length - 1; i >= 0; i--) {
      if (t >= result[i].start) {
        result[i].value++;
        break;
      }
    }
  }
  return result.map(({ day, value }) => ({ day, value }));
}

function trendPercent(prior: number, recent: number): number {
  if (prior === 0) return recent > 0 ? 100 : 0;
  return Math.round(((recent - prior) / prior) * 100);
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatHours(hours: number): string {
  if (!isFinite(hours) || hours <= 0) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = hours / 24;
  return `${days.toFixed(1)}d`;
}

// ─── Inline section primitives ──────────────────────────────────────────────

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

function TrendPill({ pct }: { pct: number }) {
  if (pct === 0) {
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
        —
      </span>
    );
  }
  const up = pct > 0;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        up
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
      }`}
    >
      {up ? `↑ ${pct}%` : `↓ ${Math.abs(pct)}%`}
    </span>
  );
}

function InsightCard({
  accent,
  value,
  label,
  subtitle,
  trend,
}: {
  accent: string;
  value: number;
  label: string;
  subtitle: string;
  trend?: number;
}) {
  return (
    <div
      className={`rounded-xl border bg-card shadow-sm border-t-4 ${accent} p-4 md:p-6`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[26px] md:text-[30px] font-bold tabular-nums leading-none text-foreground">
          {value.toLocaleString()}
        </p>
        {trend !== undefined && <TrendPill pct={trend} />}
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

// Horizontal "bar list" used for "avg hours per dept" type breakdowns.
function HorizontalBars({
  data,
  unit,
  emptyText,
}: {
  data: { name: string; value: number }[];
  unit: string;
  emptyText: string;
}) {
  const max = data.reduce((m, d) => Math.max(m, d.value), 0);
  if (max === 0 || data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
        {emptyText}
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {data.map((d) => {
        const widthPct = max > 0 ? Math.max(2, (d.value / max) * 100) : 0;
        return (
          <li key={d.name}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-xs font-medium text-foreground">
                {d.name}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {unit === "h" ? formatHours(d.value) : `${d.value.toLocaleString()} ${unit}`}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// Stacked horizontal bar for funnel-style breakdowns (Priority, Submission).
function StackedFunnel({
  data,
  total,
}: {
  data: { key: string; label: string; count: number; bar: string; dot: string; text: string }[];
  total: number;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums text-foreground">
          {total.toLocaleString()}
        </span>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          total
        </span>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {data.map((item) => {
          const widthPct = total > 0 ? (item.count / total) * 100 : 0;
          if (widthPct === 0) return null;
          return (
            <div
              key={item.key}
              className={`h-full ${item.bar} transition-[width] duration-300`}
              style={{ width: `${widthPct}%` }}
              title={`${item.label}: ${item.count}`}
            />
          );
        })}
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {data.map((item) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <li
              key={item.key}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className={`size-2 shrink-0 rounded-full ${item.dot}`} />
                <span className="truncate text-xs font-medium text-foreground">
                  {item.label}
                </span>
              </div>
              <div className="flex shrink-0 items-baseline gap-1.5">
                <span className={`text-sm font-bold tabular-nums ${item.text}`}>
                  {item.count.toLocaleString()}
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

// ─── Page (Admin only) ──────────────────────────────────────────────────────

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setHours(0, 0, 0, 0);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 59);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setHours(0, 0, 0, 0);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

  const twelveWeeksAgo = new Date(now);
  twelveWeeksAgo.setHours(0, 0, 0, 0);
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7 + 1);

  const [
    activeClientCount,
    leadCount,
    inactiveClientCount,
    openTaskCount,
    overdueTaskCount,
    unreadEmailCount,
    submissionsInProgress,
    totalUsersActive,

    newClientsLast30,
    newClientsPrior30,
    tasksCreatedLast7,
    tasksCreatedPrior7,

    emailsLast30,
    tasksCompletedLast30,
    clientsLast12Weeks,

    tasksByDeptGroup,
    openTasksByStatusGroup,
    openTasksByPriorityGroup,

    submissionStatusGroup,

    repliedEmailsLast30,

    openTasksByAssigneeGroup,

    activeClientsByPartnerGroup,
    usersForLookup,
    submissionsInProgressDetail,
    emailsByDeptLast30,
    unreadByDeptGroup,
    totalTasksByDeptGroup,
    completedTasksByDeptGroup,
    overdueTasksByDeptGroup,

    auditLogEntries,
  ] = await Promise.all([
    // KPI counts
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.client.count({ where: { status: "LEAD" } }),
    prisma.client.count({ where: { status: "INACTIVE" } }),
    prisma.task.count({ where: { status: { not: "COMPLETED" } } }),
    prisma.task.count({
      where: { deadline: { lt: now }, status: { not: "COMPLETED" } },
    }),
    prisma.email.count({ where: { isIncoming: true, isReplied: false } }),
    prisma.clientSubmission.count({
      where: { status: { in: ["INCOMPLETE", "UNDER_REVIEW"] } },
    }),
    prisma.user.count({ where: { isActive: true } }),

    // For trend pills
    prisma.client.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.client.count({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
    prisma.task.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.task.count({
      where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
    }),

    // Time series
    prisma.email.findMany({
      where: { isIncoming: true, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.task.findMany({
      where: { completedAt: { gte: thirtyDaysAgo } },
      select: { completedAt: true, createdAt: true, department: true },
    }),
    prisma.client.findMany({
      where: { createdAt: { gte: twelveWeeksAgo } },
      select: { createdAt: true },
    }),

    // Task distribution
    prisma.task.groupBy({
      by: ["department"],
      _count: { id: true },
      where: { status: { not: "COMPLETED" } },
    }),
    prisma.task.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { status: { not: "COMPLETED" } },
    }),
    prisma.task.groupBy({
      by: ["priority"],
      _count: { id: true },
      where: { status: { not: "COMPLETED" } },
    }),

    // Submission funnel
    prisma.clientSubmission.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    // Email response-time sample
    prisma.email.findMany({
      where: {
        isIncoming: true,
        isReplied: true,
        repliedAt: { not: null },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true, repliedAt: true, recipientDept: true },
    }),

    // Top 10 workload
    prisma.task.groupBy({
      by: ["assignedToId"],
      _count: { id: true },
      where: { status: { not: "COMPLETED" }, assignedToId: { not: null } },
    }),

    // Department breakdown sources
    prisma.client.groupBy({
      by: ["assignedToId"],
      _count: { id: true },
      where: { status: "ACTIVE", assignedToId: { not: null } },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, department: true },
    }),
    prisma.clientSubmission.findMany({
      where: { status: { in: ["INCOMPLETE", "UNDER_REVIEW"] } },
      select: { processType: { select: { department: true } } },
    }),
    prisma.email.groupBy({
      by: ["recipientDept"],
      _count: { id: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.email.groupBy({
      by: ["recipientDept"],
      _count: { id: true },
      where: { isIncoming: true, isReplied: false },
    }),
    prisma.task.groupBy({
      by: ["department"],
      _count: { id: true },
    }),
    prisma.task.groupBy({
      by: ["department"],
      _count: { id: true },
      where: { status: "COMPLETED" },
    }),
    prisma.task.groupBy({
      by: ["department"],
      _count: { id: true },
      where: { deadline: { lt: now }, status: { not: "COMPLETED" } },
    }),

    // Audit log
    prisma.auditLog.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
  ]);

  // ── Build chart data ────────────────────────────────────────────────────

  const last30Days = buildLastNDays(30);
  const emailsSeries = bucketByDay(
    emailsLast30.map((e) => e.createdAt),
    last30Days,
  );
  const tasksCompletedSeries = bucketByDay(
    tasksCompletedLast30
      .map((t) => t.completedAt)
      .filter((d): d is Date => d !== null),
    last30Days,
  );
  const last12Weeks = buildLast12Weeks();
  const newClientsSeries = bucketByWeek(
    clientsLast12Weeks.map((c) => c.createdAt),
    last12Weeks,
  );

  const emailsTrend = trendPercent(
    emailsSeries.slice(0, 15).reduce((s, p) => s + p.value, 0),
    emailsSeries.slice(15).reduce((s, p) => s + p.value, 0),
  );
  const tasksCompletedTrend = trendPercent(
    tasksCompletedSeries.slice(0, 15).reduce((s, p) => s + p.value, 0),
    tasksCompletedSeries.slice(15).reduce((s, p) => s + p.value, 0),
  );
  const newClientsTrend = trendPercent(
    newClientsSeries.slice(0, 6).reduce((s, p) => s + p.value, 0),
    newClientsSeries.slice(6).reduce((s, p) => s + p.value, 0),
  );

  const clientsTrendPill = trendPercent(newClientsPrior30, newClientsLast30);
  const openTasksTrendPill = trendPercent(tasksCreatedPrior7, tasksCreatedLast7);

  // Tasks by department bar data
  const tasksByDeptChart = ALL_DEPTS.map((d) => {
    const row = tasksByDeptGroup.find((r) => r.department === d);
    return { name: DEPT_LABELS[d], tasks: row?._count.id ?? 0 };
  })
    .filter((r) => r.tasks > 0)
    .sort((a, b) => b.tasks - a.tasks);

  // Tasks by status — feed to TasksByStatusChart (excludes COMPLETED, which the query already does)
  const tasksByStatusData = (["TODO", "IN_PROGRESS", "REVIEW", "APPROVED"] as const).map(
    (s) => {
      const row = openTasksByStatusGroup.find((r) => r.status === s);
      return { status: s, count: row?._count.id ?? 0 };
    },
  );
  const tasksByStatusTotal = tasksByStatusData.reduce((s, r) => s + r.count, 0);

  // Tasks by priority — feed to StackedFunnel
  const priorityOrder = ["URGENT", "HIGH", "MEDIUM", "LOW"] as const;
  const priorityFunnel = priorityOrder.map((p) => {
    const row = openTasksByPriorityGroup.find((r) => r.priority === p);
    const meta = PRIORITY_META[p];
    return {
      key: p,
      label: meta.label,
      count: row?._count.id ?? 0,
      bar: meta.bar,
      dot: meta.dot,
      text: meta.text,
    };
  });
  const priorityTotal = priorityFunnel.reduce((s, r) => s + r.count, 0);

  // Submission funnel
  const submissionOrder = [
    "INCOMPLETE",
    "COMPLETE",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
  ] as const;
  const submissionFunnel = submissionOrder.map((s) => {
    const row = submissionStatusGroup.find((r) => r.status === s);
    const meta = SUBMISSION_META[s];
    return {
      key: s,
      label: meta.label,
      count: row?._count.id ?? 0,
      bar: meta.bar,
      dot: meta.dot,
      text: meta.text,
    };
  });
  const submissionTotal = submissionFunnel.reduce((s, r) => s + r.count, 0);

  // Avg task completion time per department (last 30d)
  const taskTimeByDept = new Map<string, { total: number; count: number }>();
  for (const t of tasksCompletedLast30) {
    if (!t.department || !t.completedAt) continue;
    const hours =
      (t.completedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
    if (hours < 0) continue;
    const entry = taskTimeByDept.get(t.department) ?? { total: 0, count: 0 };
    entry.total += hours;
    entry.count += 1;
    taskTimeByDept.set(t.department, entry);
  }
  const avgCompletionBars = ALL_DEPTS.map((d) => {
    const e = taskTimeByDept.get(d);
    return {
      name: DEPT_LABELS[d],
      value: e && e.count > 0 ? e.total / e.count : 0,
    };
  })
    .filter((r) => r.value > 0)
    .sort((a, b) => a.value - b.value);

  // Avg email response time per dept (last 30d)
  const emailRespByDept = new Map<string, { total: number; count: number }>();
  for (const e of repliedEmailsLast30) {
    if (!e.recipientDept || !e.repliedAt) continue;
    const hours =
      (e.repliedAt.getTime() - e.createdAt.getTime()) / (1000 * 60 * 60);
    if (hours < 0) continue;
    const entry = emailRespByDept.get(e.recipientDept) ?? { total: 0, count: 0 };
    entry.total += hours;
    entry.count += 1;
    emailRespByDept.set(e.recipientDept, entry);
  }
  const avgResponseBars = ALL_DEPTS.map((d) => {
    const e = emailRespByDept.get(d);
    return {
      name: DEPT_LABELS[d],
      value: e && e.count > 0 ? e.total / e.count : 0,
    };
  })
    .filter((r) => r.value > 0)
    .sort((a, b) => a.value - b.value);

  // Top 10 employees by open task count
  const topAssigneeIds = openTasksByAssigneeGroup
    .filter((r) => r.assignedToId !== null)
    .sort((a, b) => b._count.id - a._count.id)
    .slice(0, 10);
  const userMap = new Map(usersForLookup.map((u) => [u.id, u]));
  const workloadChart = topAssigneeIds.map((r) => ({
    name: userMap.get(r.assignedToId!)?.name ?? "Unknown",
    tasks: r._count.id,
  }));

  // Department breakdown table
  // Active clients per dept (route through partner's department)
  const activeClientsByDept = new Map<string, number>();
  for (const r of activeClientsByPartnerGroup) {
    const u = userMap.get(r.assignedToId!);
    if (!u?.department) continue;
    activeClientsByDept.set(
      u.department,
      (activeClientsByDept.get(u.department) ?? 0) + r._count.id,
    );
  }
  const submissionsByDept = new Map<string, number>();
  for (const s of submissionsInProgressDetail) {
    const dept = s.processType?.department;
    if (!dept) continue;
    submissionsByDept.set(dept, (submissionsByDept.get(dept) ?? 0) + 1);
  }
  const emailsByDept = new Map<string, number>();
  for (const r of emailsByDeptLast30) {
    if (!r.recipientDept) continue;
    emailsByDept.set(r.recipientDept, r._count.id);
  }
  const unreadByDept = new Map<string, number>();
  for (const r of unreadByDeptGroup) {
    if (!r.recipientDept) continue;
    unreadByDept.set(r.recipientDept, r._count.id);
  }
  const openByDept = new Map<string, number>();
  for (const r of tasksByDeptGroup) {
    if (!r.department) continue;
    openByDept.set(r.department, r._count.id);
  }
  const totalByDept = new Map<string, number>();
  for (const r of totalTasksByDeptGroup) {
    if (!r.department) continue;
    totalByDept.set(r.department, r._count.id);
  }
  const completedByDept = new Map<string, number>();
  for (const r of completedTasksByDeptGroup) {
    if (!r.department) continue;
    completedByDept.set(r.department, r._count.id);
  }
  const overdueByDept = new Map<string, number>();
  for (const r of overdueTasksByDeptGroup) {
    if (!r.department) continue;
    overdueByDept.set(r.department, r._count.id);
  }

  const deptRows = ALL_DEPTS.map((d) => {
    const total = totalByDept.get(d) ?? 0;
    const completed = completedByDept.get(d) ?? 0;
    const completion = total > 0 ? Math.round((completed / total) * 100) : 0;
    const respEntry = emailRespByDept.get(d);
    const avgResp = respEntry && respEntry.count > 0 ? respEntry.total / respEntry.count : 0;
    return {
      dept: d,
      label: DEPT_LABELS[d],
      activeClients: activeClientsByDept.get(d) ?? 0,
      openTasks: openByDept.get(d) ?? 0,
      overdue: overdueByDept.get(d) ?? 0,
      completionRate: completion,
      avgResponse: avgResp,
      emails: emailsByDept.get(d) ?? 0,
      unread: unreadByDept.get(d) ?? 0,
      submissions: submissionsByDept.get(d) ?? 0,
    };
  });

  // ── Display values ────────────────────────────────────────────────────
  const totalClients = activeClientCount + leadCount + inactiveClientCount;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* ─── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight text-brand-700 dark:text-brand-400">
            Firm Analytics
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Firm-wide insights · {today}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-brand-200/60 bg-brand-100/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:border-brand-800/50 dark:bg-brand-900/40 dark:text-brand-300">
            Admin
          </span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {totalUsersActive.toLocaleString()} active users · {totalClients.toLocaleString()} clients
          </span>
        </div>
      </div>

      {/* ─── KPI strip ────────────────────────────────────────────────── */}
      <section>
        <SectionLabel icon={Sparkles}>Overview</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <InsightCard
            accent="border-t-brand-500"
            value={activeClientCount}
            label="Active clients"
            subtitle="Status = ACTIVE"
            trend={clientsTrendPill}
          />
          <InsightCard
            accent="border-t-cyan-500"
            value={leadCount}
            label="Leads in pipeline"
            subtitle="Awaiting conversion"
          />
          <InsightCard
            accent="border-t-amber-500"
            value={openTaskCount}
            label="Open tasks"
            subtitle="All statuses except COMPLETED"
            trend={openTasksTrendPill}
          />
          <InsightCard
            accent="border-t-red-500"
            value={overdueTaskCount}
            label="Overdue tasks"
            subtitle="Past deadline, not completed"
          />
          <InsightCard
            accent="border-t-violet-500"
            value={unreadEmailCount}
            label="Unread emails"
            subtitle="Incoming, awaiting reply"
          />
          <InsightCard
            accent="border-t-emerald-500"
            value={submissionsInProgress}
            label="Submissions in progress"
            subtitle="Incomplete or under review"
          />
        </div>
      </section>

      {/* ─── Trends ──────────────────────────────────────────────────── */}
      <section>
        <SectionLabel icon={LineChart}>Trends</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border bg-card p-4 md:p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Emails received
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Last 30 days · recent 15 vs prior 15
                </p>
              </div>
              <TrendPill pct={emailsTrend} />
            </div>
            <div className="mt-4 -ml-2">
              <EmailsAreaChart data={emailsSeries} />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 md:p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Tasks completed
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Last 30 days · recent 15 vs prior 15
                </p>
              </div>
              <TrendPill pct={tasksCompletedTrend} />
            </div>
            <div className="mt-4 -ml-2">
              <TasksAreaChart data={tasksCompletedSeries} />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 md:p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  New clients
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Last 12 weeks · recent 6 vs prior 6
                </p>
              </div>
              <TrendPill pct={newClientsTrend} />
            </div>
            <div className="mt-4 -ml-2">
              <TasksAreaChart data={newClientsSeries} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Task distribution ───────────────────────────────────────── */}
      <section>
        <SectionLabel icon={Layers}>Task distribution</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border bg-card p-4 md:p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">
              Open tasks by department
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              All statuses except completed
            </p>
            <div className="mt-4 -ml-2">
              {tasksByDeptChart.length > 0 ? (
                <TasksByTeamChart data={tasksByDeptChart} />
              ) : (
                <div className="flex h-[320px] items-center justify-center text-xs text-muted-foreground">
                  No open tasks
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 md:p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">
              Open tasks by status
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              TODO → APPROVED, excluding completed
            </p>
            <TasksByStatusChart data={tasksByStatusData} total={tasksByStatusTotal} />
          </div>

          <div className="rounded-xl border bg-card p-4 md:p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">
              Open tasks by priority
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Urgent, high, medium, low
            </p>
            <div className="mt-4">
              <StackedFunnel data={priorityFunnel} total={priorityTotal} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Submission funnel ───────────────────────────────────────── */}
      <section>
        <SectionLabel icon={ListChecks}>Submission funnel</SectionLabel>
        <div className="mt-3 rounded-xl border bg-card p-4 md:p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Client submissions
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                INCOMPLETE → COMPLETE → UNDER_REVIEW → APPROVED / REJECTED
              </p>
            </div>
          </div>
          <div className="mt-4">
            <StackedFunnel data={submissionFunnel} total={submissionTotal} />
          </div>
        </div>
      </section>

      {/* ─── Performance & SLA ───────────────────────────────────────── */}
      <section>
        <SectionLabel icon={Clock}>Performance & SLA</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-4 md:p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">
              Avg task completion time
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              By department · tasks completed in last 30 days
            </p>
            <div className="mt-5">
              <HorizontalBars
                data={avgCompletionBars}
                unit="h"
                emptyText="No completed tasks in this window"
              />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 md:p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">
              Avg email response time
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              By department · replied in last 30 days
            </p>
            <div className="mt-5">
              <HorizontalBars
                data={avgResponseBars}
                unit="h"
                emptyText="No replied emails in this window"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Workload — Top 10 ───────────────────────────────────────── */}
      <section>
        <SectionLabel icon={Users}>Workload — Top 10 by open tasks</SectionLabel>
        <div className="mt-3 rounded-xl border bg-card p-4 md:p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">
            Open tasks per employee
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Top 10 assignees · excluding completed
          </p>
          <div className="mt-4 -ml-2">
            {workloadChart.length > 0 ? (
              <TasksByTeamChart data={workloadChart} />
            ) : (
              <div className="flex h-[320px] items-center justify-center text-xs text-muted-foreground">
                No open tasks assigned
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Department breakdown table ──────────────────────────────── */}
      <section>
        <SectionLabel icon={Building2}>Department breakdown</SectionLabel>
        <div className="mt-3 overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto -mx-0 sm:mx-0">
            <table className="w-full min-w-[420px] md:min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium text-right tabular-nums">
                    Open
                  </th>
                  <th className="px-4 py-3 font-medium text-right tabular-nums hidden md:table-cell">
                    Overdue
                  </th>
                  <th className="px-4 py-3 font-medium text-right tabular-nums">
                    Completion
                  </th>
                  <th className="px-4 py-3 font-medium text-right tabular-nums hidden md:table-cell">
                    Avg response
                  </th>
                  <th className="px-4 py-3 font-medium text-right tabular-nums hidden md:table-cell">
                    Emails 30d
                  </th>
                  <th className="px-4 py-3 font-medium text-right tabular-nums hidden md:table-cell">
                    Unread
                  </th>
                  <th className="px-4 py-3 font-medium text-right tabular-nums hidden md:table-cell">
                    Active clients
                  </th>
                  <th className="px-4 py-3 font-medium text-right tabular-nums hidden md:table-cell">
                    Submissions
                  </th>
                </tr>
              </thead>
              <tbody>
                {deptRows.map((row, i) => (
                  <tr
                    key={row.dept}
                    className={`border-b last:border-0 transition-colors hover:bg-muted/30 ${
                      i % 2 === 1 ? "bg-muted/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.openTasks.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">
                      <span
                        className={
                          row.overdue > 0
                            ? "text-red-600 dark:text-red-400 font-medium"
                            : "text-muted-foreground"
                        }
                      >
                        {row.overdue.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span
                        className={
                          row.completionRate >= 70
                            ? "text-emerald-600 dark:text-emerald-400"
                            : row.completionRate >= 40
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                        }
                      >
                        {row.completionRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell text-muted-foreground">
                      {formatHours(row.avgResponse)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell text-muted-foreground">
                      {row.emails.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">
                      <span
                        className={
                          row.unread > 0
                            ? "text-amber-600 dark:text-amber-400 font-medium"
                            : "text-muted-foreground"
                        }
                      >
                        {row.unread.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell text-muted-foreground">
                      {row.activeClients.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell text-muted-foreground">
                      {row.submissions.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── Recent activity ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between">
          <SectionLabel icon={Activity}>Recent activity</SectionLabel>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            Last {auditLogEntries.length} actions
          </span>
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border bg-card shadow-sm">
          {auditLogEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <Activity className="size-5 text-muted-foreground" />
              </span>
              <p className="mt-3 text-sm font-medium text-foreground">
                No recent activity
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Audit log entries will appear here as users act.
              </p>
            </div>
          ) : (
            <ul>
              {auditLogEntries.map((entry, idx) => (
                <li key={entry.id}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 ${
                      idx > 0 ? "border-t" : ""
                    }`}
                  >
                    <span className="size-2 shrink-0 rounded-full bg-brand-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">
                        <span className="font-medium">
                          {entry.user?.name ?? "Unknown user"}
                        </span>
                        <span className="text-muted-foreground"> · </span>
                        <span className="font-mono text-xs text-foreground/80">
                          {entry.action}
                        </span>
                        <span className="text-muted-foreground"> · </span>
                        <span className="text-xs text-muted-foreground">
                          {entry.entity}
                        </span>
                      </p>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {timeAgo(entry.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
