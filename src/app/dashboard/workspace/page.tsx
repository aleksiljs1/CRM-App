import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Mail,
  CheckSquare,
  FileText,
  Award,
  Sparkles,
  Activity,
  Zap,
  Clock,
  ArrowRight,
  Gauge,
  CheckCircle2,
  LineChart,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  EmailsAreaChart,
  TasksAreaChart,
} from "@/components/dashboard/activity-charts";
import { getPerformanceData } from "@/app/api/performance/route";

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

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Time-series helpers (last 14 days) ──────────────────────────────────────

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Build an ordered array of the last 14 days (local time), oldest → today. */
function buildLast14Days(): { key: string; label: string }[] {
  const days: { key: string; label: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      key: dayKey(d),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }
  return days;
}

/** Bucket a list of Dates into the 14-day window — returns {day, value}[]. */
function bucketByDay(
  dates: Date[],
  days: { key: string; label: string }[]
): { day: string; value: number }[] {
  const counts = new Map<string, number>(days.map((d) => [d.key, 0]));
  for (const date of dates) {
    const k = dayKey(date);
    if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return days.map((d) => ({ day: d.label, value: counts.get(d.key) ?? 0 }));
}

/** % change of the most-recent 7 days vs the previous 7 days of a 14-day series. */
function trendPercent(series: { value: number }[]): number {
  const prior = series.slice(0, 7).reduce((s, p) => s + p.value, 0);
  const recent = series.slice(7).reduce((s, p) => s + p.value, 0);
  if (prior === 0) return recent > 0 ? 100 : 0;
  return Math.round(((recent - prior) / prior) * 100);
}

// ── Inline section primitives ───────────────────────────────────────────────

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

function InsightCard({
  accent,
  value,
  label,
  subtitle,
}: {
  accent: string;
  value: number;
  label: string;
  subtitle: string;
}) {
  return (
    <div
      className={`rounded-xl border bg-card shadow-sm border-t-4 ${accent} p-6`}
    >
      <p className="text-[30px] font-bold tabular-nums leading-none text-foreground">
        {value}
      </p>
      <p className="mt-3 text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function SmallStat({
  icon: Icon,
  iconBg,
  iconText,
  value,
  label,
}: {
  icon: LucideIcon;
  iconBg: string;
  iconText: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <span
        className={`flex size-9 items-center justify-center rounded-lg ${iconBg} ${iconText}`}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-base font-bold tabular-nums leading-tight text-foreground">
          {value}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      </div>
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
        up ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
      }`}
    >
      {up ? `↑ ${pct}%` : `↓ ${Math.abs(pct)}%`}
    </span>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300/60 hover:shadow-md"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function ScoreCard({
  score,
  rank,
  totalEmployees,
}: {
  score: number;
  rank: number | null;
  totalEmployees: number;
}) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.max(0, Math.min(100, score));
  const progress = (safeScore / 100) * circumference;

  const scoreColor =
    safeScore >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : safeScore >= 60
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="flex h-full flex-col rounded-xl border bg-card p-6 shadow-sm">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Performance
      </span>

      <div className="flex flex-1 flex-col items-center justify-center pt-2">
        <div className="relative flex items-center justify-center">
          <svg
            width="180"
            height="180"
            viewBox="0 0 180 180"
            className="-rotate-90"
          >
            <defs>
              <linearGradient
                id="hrScoreGradient"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor="var(--color-brand-400)" />
                <stop offset="100%" stopColor="var(--color-brand-600)" />
              </linearGradient>
            </defs>

            {/* Track */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="var(--color-border)"
              strokeOpacity="0.6"
              strokeWidth="10"
            />

            {/* Progress */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="url(#hrScoreGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              className="transition-all duration-[1200ms] ease-out"
            />
          </svg>

          <div className="absolute flex flex-col items-center">
            <span
              className={`text-5xl font-bold tabular-nums tracking-tight ${scoreColor}`}
            >
              {safeScore}
            </span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              out of 100
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-1.5">
          <Trophy className="size-3.5 text-amber-500" />
          {rank !== null ? (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">#{rank}</span>{" "}
              of {totalEmployees} employees
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Not ranked</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function HRDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const department = session.user.department;
  const role = session.user.role;
  const isAdmin = role === "ADMIN" || role === "PARTNER";

  // Build department filter for queries
  const deptFilter = isAdmin ? {} : { recipientDept: department || "HR" };
  const taskDeptFilter = isAdmin ? {} : { department: department || "HR" };

  // 14-day window for the Trends charts.
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setHours(0, 0, 0, 0);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

  const [
    unreadEmailCount,
    totalClients,
    pendingTasks,
    openProcesses,
    recentEmails,
    emailsLast14d,
    tasksCompletedLast14d,
  ] = await Promise.all([
    prisma.email.count({
      where: {
        ...deptFilter,
        isIncoming: true,
        isReplied: false,
      },
    }),
    prisma.client.count({
      where: isAdmin ? {} : { assignedTo: { department: department || "HR" } },
    }),
    prisma.task.count({
      where: {
        ...taskDeptFilter,
        status: { not: "COMPLETED" },
      },
    }),
    prisma.clientSubmission.count({
      where: {
        status: { in: ["INCOMPLETE", "UNDER_REVIEW"] },
        ...(isAdmin ? {} : { processType: { department: department || "HR" } }),
      },
    }),
    prisma.email.findMany({
      where: {
        ...deptFilter,
        isIncoming: true,
        isReplied: false,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Trends — incoming emails received per day, last 14 days, department-scoped.
    prisma.email.findMany({
      where: {
        ...deptFilter,
        isIncoming: true,
        createdAt: { gte: fourteenDaysAgo },
      },
      select: { createdAt: true },
    }),
    // Trends — tasks completed per day, last 14 days, department-scoped.
    prisma.task.findMany({
      where: {
        ...taskDeptFilter,
        status: "COMPLETED",
        completedAt: { gte: fourteenDaysAgo },
      },
      select: { completedAt: true },
    }),
  ]);

  // Performance score (server-side, no HTTP round-trip).
  // Wrapped in try/catch so a failure in performance computation doesn't break
  // the dashboard — falls back to a "Not ranked" score card.
  let myScore = 0;
  let myRank: number | null = null;
  let totalEmployees = 0;
  try {
    const allPerformance = await getPerformanceData();
    totalEmployees = allPerformance.length;
    const myIndex = allPerformance.findIndex(
      (d) => d.user.id === session.user.id
    );
    if (myIndex >= 0) {
      myScore = allPerformance[myIndex].performanceScore;
      myRank = myIndex + 1;
    }
  } catch (err) {
    console.error("Failed to load performance data for HR dashboard:", err);
  }

  // Aggregate the two findMany results into ordered 14-day buckets.
  const trendDays = buildLast14Days();
  const emailsByDay = bucketByDay(
    emailsLast14d.map((e) => e.createdAt),
    trendDays
  );
  const tasksByDay = bucketByDay(
    tasksCompletedLast14d
      .map((t) => t.completedAt)
      .filter((d): d is Date => d !== null),
    trendDays
  );
  const emailsTrendPct = trendPercent(emailsByDay);
  const tasksTrendPct = trendPercent(tasksByDay);

  const deptDisplayName = getDeptName(department);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const isJuniorRole = ["JUNIOR", "ASSISTANT", "INTERN"].includes(role || "");

  // Section 1 — Insight cards (preserve junior-role filtering from before)
  const allInsights = [
    {
      accent: "border-t-brand-500",
      value: unreadEmailCount,
      label: "Unread Emails",
      subtitle: "Awaiting your reply",
    },
    {
      accent: "border-t-emerald-500",
      value: totalClients,
      label: "Total Clients",
      subtitle: "Active accounts on record",
      hideForJunior: true,
    },
    {
      accent: "border-t-amber-500",
      value: pendingTasks,
      label: "Pending Tasks",
      subtitle: "Open across the department",
    },
    {
      accent: "border-t-violet-500",
      value: openProcesses,
      label: "Open Processes",
      subtitle: "Submissions in progress",
      hideForJunior: true,
    },
  ];
  const insights = allInsights.filter(
    (s) => !(isJuniorRole && s.hideForJunior)
  );

  return (
    <div className="space-y-8">
      {/* Page title row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-brand-700">
            {deptDisplayName} Dashboard
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Overview of your workspace &middot; {today}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <span className="inline-flex items-center rounded-full border border-brand-200/60 bg-brand-100/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:border-brand-800/50 dark:bg-brand-900/40 dark:text-brand-300">
            {deptDisplayName}
          </span>
          <Link href="/dashboard/workspace/emails">
            <Button className="gap-2">
              <Mail className="size-4" />
              View All Emails
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Section 1 — Insights + Performance score ──────────────────── */}
      <section>
        <SectionLabel icon={Sparkles}>Overview</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-2">
            {insights.map((s) => (
              <InsightCard
                key={s.label}
                accent={s.accent}
                value={s.value}
                label={s.label}
                subtitle={s.subtitle}
              />
            ))}
          </div>
          <ScoreCard
            score={myScore}
            rank={myRank}
            totalEmployees={totalEmployees}
          />
        </div>
      </section>

      {/* ── Section 2 — Platform overview strip ──────────────────────── */}
      <section>
        <SectionLabel icon={Activity}>Platform</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SmallStat
            icon={Activity}
            iconBg="bg-cyan-100 dark:bg-cyan-900/40"
            iconText="text-cyan-700 dark:text-cyan-300"
            value="94%"
            label="Reply rate today"
          />
          <SmallStat
            icon={Clock}
            iconBg="bg-amber-100 dark:bg-amber-900/40"
            iconText="text-amber-700 dark:text-amber-300"
            value="1h 12m"
            label="Avg response"
          />
          <SmallStat
            icon={CheckCircle2}
            iconBg="bg-emerald-100 dark:bg-emerald-900/40"
            iconText="text-emerald-700 dark:text-emerald-300"
            value="On track"
            label="SLA today"
          />
          <SmallStat
            icon={Gauge}
            iconBg="bg-violet-100 dark:bg-violet-900/40"
            iconText="text-violet-700 dark:text-violet-300"
            value="92%"
            label="Workload utilization"
          />
        </div>
      </section>

      {/* ── Trends — two charts side by side ────────────────────────── */}
      <section>
        <SectionLabel icon={LineChart}>Trends</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Emails received
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Last 14 days &middot; vs prior 7
                </p>
              </div>
              <TrendPill pct={emailsTrendPct} />
            </div>
            <div className="mt-4 -ml-2">
              <EmailsAreaChart data={emailsByDay} />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Tasks completed
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Last 14 days &middot; vs prior 7
                </p>
              </div>
              <TrendPill pct={tasksTrendPct} />
            </div>
            <div className="mt-4 -ml-2">
              <TasksAreaChart data={tasksByDay} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3 — Quick actions ────────────────────────────────── */}
      <section>
        <SectionLabel icon={Zap}>Quick actions</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <QuickAction
            href="/dashboard/workspace/emails"
            icon={Mail}
            title="View All Emails"
            subtitle="Manage your inbox"
          />
          <QuickAction
            href="/dashboard/workspace/tasks"
            icon={CheckSquare}
            title="Manage Tasks"
            subtitle="Track and complete work"
          />
          <QuickAction
            href="/dashboard/workspace/documents"
            icon={FileText}
            title="Documents"
            subtitle="Files and submissions"
          />
          <QuickAction
            href="/dashboard/workspace/performance"
            icon={Award}
            title="My Performance"
            subtitle="Score, ranking and growth"
          />
        </div>
      </section>

      {/* ── Section 4 — Recent activity ──────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between">
          <SectionLabel icon={Clock}>Recent activity</SectionLabel>
          <Link
            href="/dashboard/workspace/emails"
            className="text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            View all &rarr;
          </Link>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border bg-card shadow-sm">
          {recentEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
                <CheckCircle2 className="size-6 text-muted-foreground" />
              </span>
              <p className="mt-3 text-sm font-medium text-foreground">
                Inbox zero
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                No unread emails — you&apos;re all caught up.
              </p>
            </div>
          ) : (
            <ul>
              {recentEmails.map((email, idx) => {
                const isUrgent = /urgent/i.test(email.subject);
                const name = email.senderName || email.senderEmail;
                return (
                  <li key={email.id}>
                    <Link
                      href="/dashboard/workspace/emails"
                      className={`flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/40 ${
                        idx > 0 ? "border-t" : ""
                      }`}
                    >
                      <span className="size-2 shrink-0 rounded-full bg-brand-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {email.subject}
                        </p>
                      </div>
                      {isUrgent && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-700 dark:bg-red-950 dark:text-red-300">
                          Urgent
                        </span>
                      )}
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {timeAgo(email.createdAt)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
