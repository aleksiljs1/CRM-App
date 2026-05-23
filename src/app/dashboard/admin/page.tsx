import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users,
  Building2,
  ListTodo,
  Mail,
  FolderOpen,
  Sparkles,
  Activity,
  Zap,
  Clock,
  ArrowRight,
  Gauge,
  CheckCircle2,
  LineChart,
  ShieldCheck,
  BarChart3,
  CheckSquare,
  type LucideIcon,
} from "lucide-react";
import {
  EmailsAreaChart,
  TasksAreaChart,
} from "@/components/dashboard/activity-charts";

const DEPT_LABELS: Record<string, string> = {
  AUDIT: "Audit",
  ACCOUNTING_TAX: "Tax",
  BOOKKEEPING_PAYROLL: "Payroll",
  LEGAL: "Legal",
  ADVISORY: "Advisory",
  HR: "HR",
  MARKETING: "Marketing",
  FINANCE: "Finance",
};

// ── Inline section primitives (mirrored from HR dashboard) ──────────────────

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

// ── Page ────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const [
    totalUsers,
    usersByRole,
    departmentsActive,
    totalClients,
    totalTasks,
    totalEmails,
    allUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({
      by: ["role"],
      _count: { id: true },
    }),
    prisma.user.groupBy({
      by: ["department"],
      where: { department: { not: null }, isActive: true },
    }),
    prisma.client.count(),
    prisma.task.count(),
    prisma.email.count(),
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
      },
    }),
  ]);

  // Derived metrics (no new Prisma queries — computed from existing data)
  const activeUsers = allUsers.filter((u) => u.isActive).length;
  const inactiveUsers = allUsers.length - activeUsers;
  const activePct =
    totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Page title row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-brand-700 dark:text-brand-400">
            Admin Overview
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            System-wide control &middot; {today}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <span className="inline-flex items-center rounded-full border border-slate-200/60 bg-slate-100/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:border-slate-800/50 dark:bg-slate-900/40 dark:text-slate-300">
            Admin
          </span>
          <Link href="/dashboard/admin" className="w-full md:w-auto">
            <Button className="w-full gap-2 md:w-auto">
              <Users className="size-4" />
              Manage Users
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Section 1 — Insights ──────────────────────────────────────── */}
      <section>
        <SectionLabel icon={Sparkles}>Overview</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <InsightCard
            accent="border-t-brand-500"
            value={totalUsers}
            label="Total Users"
            subtitle="Across all roles and departments"
          />
          <InsightCard
            accent="border-t-emerald-500"
            value={totalClients}
            label="Total Clients"
            subtitle="Active accounts on record"
          />
          <InsightCard
            accent="border-t-amber-500"
            value={totalTasks}
            label="Total Tasks"
            subtitle="Across the firm"
          />
          <InsightCard
            accent="border-t-violet-500"
            value={departmentsActive.length}
            label="Active Departments"
            subtitle="Departments currently staffed"
          />
        </div>
      </section>

      {/* ── Section 2 — Platform overview strip ──────────────────────── */}
      <section>
        <SectionLabel icon={Activity}>Platform</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SmallStat
            icon={Mail}
            iconBg="bg-cyan-100 dark:bg-cyan-900/40"
            iconText="text-cyan-700 dark:text-cyan-300"
            value={totalEmails.toString()}
            label="Total emails"
          />
          <SmallStat
            icon={CheckCircle2}
            iconBg="bg-amber-100 dark:bg-amber-900/40"
            iconText="text-amber-700 dark:text-amber-300"
            value={`${activePct}%`}
            label="Active users"
          />
          <SmallStat
            icon={Gauge}
            iconBg="bg-emerald-100 dark:bg-emerald-900/40"
            iconText="text-emerald-700 dark:text-emerald-300"
            value="On track" /* demo */
            label="System health"
          />
          <SmallStat
            icon={ShieldCheck}
            iconBg="bg-violet-100 dark:bg-violet-900/40"
            iconText="text-violet-700 dark:text-violet-300"
            value={inactiveUsers.toString()}
            label="Inactive users"
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
                  Email volume
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Last 14 days
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                ↑ 12%
              </span>
            </div>
            <div className="mt-4 -ml-2">
              <EmailsAreaChart />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Tasks completed
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Last 14 days
                </p>
              </div>
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                ↑ 8%
              </span>
            </div>
            <div className="mt-4 -ml-2">
              <TasksAreaChart />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4 — Quick actions ────────────────────────────────── */}
      <section>
        <SectionLabel icon={Zap}>Quick actions</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <QuickAction
            href="/dashboard/admin"
            icon={Users}
            title="Manage Users"
            subtitle="View and edit team members"
          />
          <QuickAction
            href="/dashboard/clients"
            icon={Building2}
            title="All Clients"
            subtitle="Browse client accounts"
          />
          <QuickAction
            href="/dashboard/reports"
            icon={BarChart3}
            title="Reports"
            subtitle="Firm-wide analytics"
          />
          <QuickAction
            href="/dashboard/hr/tasks"
            icon={CheckSquare}
            title="Tasks"
            subtitle="Track work across the firm"
          />
        </div>
      </section>

      {/* ── Section 5 — Recent activity (Users) ──────────────────────── */}
      <section>
        <div className="flex items-center justify-between">
          <SectionLabel icon={Clock}>Recent activity</SectionLabel>
          <Link
            href="/dashboard/admin"
            className="text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            View all &rarr;
          </Link>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border bg-card shadow-sm">
          {allUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
                <FolderOpen className="size-6 text-muted-foreground" />
              </span>
              <p className="mt-3 text-sm font-medium text-foreground">
                No users yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Invite team members to populate the system.
              </p>
            </div>
          ) : (
            <ul>
              {allUsers.slice(0, 5).map((user, idx) => (
                <li key={user.id}>
                  <Link
                    href="/dashboard/admin"
                    className={`flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/40 ${
                      idx > 0 ? "border-t" : ""
                    }`}
                  >
                    <span
                      className={`size-2 shrink-0 rounded-full ${
                        user.isActive ? "bg-brand-500" : "bg-muted-foreground/40"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                      {user.department
                        ? DEPT_LABELS[user.department] ?? user.department
                        : "—"}
                    </span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {user.role}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
