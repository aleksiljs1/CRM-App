import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TasksByDepartmentChart,
  ClientPipelineChart,
} from "@/components/dashboard-charts";
import {
  Users,
  Building2,
  ListChecks,
  CheckCircle2,
  Mail,
  FileText,
  Clock,
  CalendarDays,
  Sparkles,
  Activity,
  LineChart,
  Briefcase,
  Zap,
  ArrowRight,
  Award,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

// -- Helpers ------------------------------------------------------------------

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

function getDeptName(dept: string | null | undefined): string {
  if (!dept) return "Firm-Wide";
  return DEPT_LABELS[dept] || dept;
}

function timeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// -- Inline section primitives (matched to HR dashboard) ---------------------

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
  value: string | number;
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
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
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

// -- Page Component -----------------------------------------------------------

export default async function ManagerDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const department = session.user.department;
  const isAdmin = role === "ADMIN" || role === "PARTNER";

  // Build department-scoped filters
  const deptFilter = isAdmin ? {} : { department: (department || "HR") as string };
  const taskDeptFilter = isAdmin ? {} : { department: (department || "HR") as string };
  const emailDeptFilter = isAdmin ? {} : { recipientDept: (department || "HR") as string };

  const now = new Date();

  const [
    totalEmployees,
    activeClients,
    openTasks,
    totalTasks,
    completedTasks,
    unreadEmails,
    pendingSubmissions,
    tasksByDept,
    clientsByStatus,
    employeesByDept,
    openTasksByDept,
    recentEmails,
    recentCompletedTasks,
    upcomingDeadlines,
  ] = await Promise.all([
    // KPI counts — scoped by department for MANAGER
    prisma.user.count({
      where: { isActive: true, role: { not: "CLIENT" }, ...deptFilter },
    }),
    prisma.client.count({
      where: {
        status: "ACTIVE",
        ...(isAdmin
          ? {}
          : { assignedTo: { department: (department || "HR") as string } }),
      },
    }),
    prisma.task.count({
      where: { status: { not: "COMPLETED" }, ...taskDeptFilter },
    }),
    prisma.task.count({ where: { ...taskDeptFilter } }),
    prisma.task.count({ where: { status: "COMPLETED", ...taskDeptFilter } }),
    prisma.email.count({
      where: { isIncoming: true, isRead: false, ...emailDeptFilter },
    }),
    prisma.clientSubmission.count({
      where: {
        status: { in: ["INCOMPLETE", "UNDER_REVIEW"] },
        ...(isAdmin
          ? {}
          : { processType: { department: (department || "HR") as string } }),
      },
    }),

    // Chart data
    prisma.task.groupBy({
      by: ["department"],
      _count: { id: true },
      where: { department: { not: null }, ...taskDeptFilter },
    }),
    prisma.client.groupBy({
      by: ["status"],
      _count: { id: true },
      ...(isAdmin
        ? {}
        : {
            where: {
              assignedTo: { department: (department || "HR") as string },
            },
          }),
    }),

    // Department workload
    prisma.user.groupBy({
      by: ["department"],
      _count: { id: true },
      where: {
        isActive: true,
        role: { not: "CLIENT" },
        department: { not: null },
        ...deptFilter,
      },
    }),
    prisma.task.groupBy({
      by: ["department"],
      _count: { id: true },
      where: {
        status: { not: "COMPLETED" },
        department: { not: null },
        ...taskDeptFilter,
      },
    }),

    // Recent activity
    prisma.email.findMany({
      where: { isIncoming: true, ...emailDeptFilter },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        subject: true,
        senderName: true,
        senderEmail: true,
        createdAt: true,
      },
    }),
    prisma.task.findMany({
      where: {
        status: "COMPLETED",
        completedAt: { not: null },
        ...taskDeptFilter,
      },
      orderBy: { completedAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        completedAt: true,
        assignedTo: { select: { name: true } },
      },
    }),

    // Upcoming deadlines
    prisma.task.findMany({
      where: {
        deadline: { gte: now },
        status: { not: "COMPLETED" },
        ...taskDeptFilter,
      },
      orderBy: { deadline: "asc" },
      take: 5,
      select: {
        id: true,
        title: true,
        deadline: true,
        priority: true,
        department: true,
        assignedTo: { select: { name: true } },
      },
    }),
  ]);

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Transform chart data
  const tasksByDeptChart = tasksByDept.map((item) => ({
    name: DEPT_LABELS[item.department ?? ""] ?? item.department ?? "N/A",
    tasks: item._count.id,
  }));

  const clientPipelineChart = clientsByStatus.map((item) => ({
    name: item.status,
    value: item._count.id,
    color:
      item.status === "LEAD"
        ? "#f59e0b"
        : item.status === "ACTIVE"
          ? "#00968a"
          : "#94a3b8",
  }));

  // Build department workload map
  const empMap = new Map<string, number>();
  employeesByDept.forEach((d) => {
    if (d.department) empMap.set(d.department, d._count.id);
  });
  const taskMap = new Map<string, number>();
  openTasksByDept.forEach((d) => {
    if (d.department) taskMap.set(d.department, d._count.id);
  });

  const allDepts = Array.from(
    new Set([...empMap.keys(), ...taskMap.keys()])
  ).sort();
  const departmentWorkload = allDepts.map((dept) => {
    const employees = empMap.get(dept) ?? 0;
    const tasks = taskMap.get(dept) ?? 0;
    const ratio = employees > 0 ? tasks / employees : tasks > 0 ? 999 : 0;
    return { dept, label: DEPT_LABELS[dept] ?? dept, employees, tasks, ratio };
  });

  // Priority badge colors
  const priorityColor: Record<string, string> = {
    URGENT: "bg-red-100 text-red-700 border-red-200",
    HIGH: "bg-orange-100 text-orange-700 border-orange-200",
    MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
    LOW: "bg-green-100 text-green-700 border-green-200",
  };

  const deptDisplayName = isAdmin ? "Firm-Wide" : getDeptName(department);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const hasActivity =
    recentEmails.length > 0 || recentCompletedTasks.length > 0;

  return (
    <div className="space-y-8">
      {/* Page title row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-brand-700">
            {deptDisplayName} Management Dashboard
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {isAdmin
              ? "Firm-wide overview and analytics"
              : `Department overview for ${deptDisplayName}`}{" "}
            &middot; {today}
          </p>
        </div>
        <Link href="/dashboard/manager/team">
          <Button className="gap-2">
            <Users className="size-4" />
            View Team
          </Button>
        </Link>
      </div>

      {/* ── Section 1 — Overview ─────────────────────────────────────── */}
      <section>
        <SectionLabel icon={Sparkles}>Overview</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <InsightCard
            accent="border-t-brand-500"
            value={totalEmployees}
            label="Total Employees"
            subtitle="Active staff in your scope"
          />
          <InsightCard
            accent="border-t-emerald-500"
            value={activeClients}
            label="Active Clients"
            subtitle="Currently engaged"
          />
          <InsightCard
            accent="border-t-amber-500"
            value={openTasks}
            label="Open Tasks"
            subtitle="Across the department"
          />
          <InsightCard
            accent="border-t-violet-500"
            value={`${completionRate}%`}
            label="Completion Rate"
            subtitle={`${completedTasks} of ${totalTasks} tasks completed`}
          />
        </div>
      </section>

      {/* ── Section 2 — Platform overview strip ─────────────────────── */}
      <section>
        <SectionLabel icon={Activity}>Platform</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SmallStat
            icon={ListChecks}
            iconBg="bg-cyan-100"
            iconText="text-cyan-700"
            value={String(totalTasks)}
            label="Total tasks"
          />
          <SmallStat
            icon={CheckCircle2}
            iconBg="bg-emerald-100"
            iconText="text-emerald-700"
            value={String(completedTasks)}
            label="Completed"
          />
          <SmallStat
            icon={Mail}
            iconBg="bg-amber-100"
            iconText="text-amber-700"
            value={String(unreadEmails)}
            label="Unread emails"
          />
          <SmallStat
            icon={FileText}
            iconBg="bg-violet-100"
            iconText="text-violet-700"
            value={String(pendingSubmissions)}
            label="Pending submissions"
          />
        </div>
      </section>

      {/* ── Section 3 — Trends (real charts) ────────────────────────── */}
      <section>
        <SectionLabel icon={LineChart}>Trends</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Tasks by Department
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Open task distribution
              </p>
            </div>
            <div className="mt-4">
              {tasksByDeptChart.length > 0 ? (
                <TasksByDepartmentChart data={tasksByDeptChart} />
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No task data available
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Client Pipeline
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Status breakdown across all clients
              </p>
            </div>
            <div className="mt-4">
              {clientPipelineChart.length > 0 ? (
                <ClientPipelineChart data={clientPipelineChart} />
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No client data available
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4 — Workload table ──────────────────────────────── */}
      <section>
        <SectionLabel icon={Briefcase}>Workload</SectionLabel>
        <div className="mt-3 overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="border-b px-5 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              Department Workload
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Staff and open task distribution
            </p>
          </div>

          {departmentWorkload.length > 0 ? (
            <div>
              <div className="grid grid-cols-4 gap-2 border-b px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Department</span>
                <span className="text-center">Staff</span>
                <span className="text-center">Open tasks</span>
                <span className="text-center">Ratio</span>
              </div>
              <ul className="divide-y">
                {departmentWorkload.map((d) => {
                  const ratioColor =
                    d.ratio < 3
                      ? "text-emerald-700 bg-emerald-50"
                      : d.ratio <= 5
                        ? "text-amber-700 bg-amber-50"
                        : "text-red-700 bg-red-50";
                  return (
                    <li
                      key={d.dept}
                      className="grid grid-cols-4 items-center gap-2 px-5 py-3 text-sm transition-colors hover:bg-muted/40"
                    >
                      <span className="font-medium text-foreground">
                        {d.label}
                      </span>
                      <span className="text-center text-muted-foreground tabular-nums">
                        {d.employees}
                      </span>
                      <span className="text-center text-muted-foreground tabular-nums">
                        {d.tasks}
                      </span>
                      <span className="flex justify-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${ratioColor}`}
                        >
                          {d.ratio === 999 ? "N/A" : d.ratio.toFixed(1)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No department data available
            </p>
          )}
        </div>
      </section>

      {/* ── Section 5 — Upcoming deadlines ──────────────────────────── */}
      <section>
        <div className="flex items-center justify-between">
          <SectionLabel icon={CalendarDays}>Upcoming deadlines</SectionLabel>
          <Link
            href="/dashboard/hr/tasks"
            className="text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            View all &rarr;
          </Link>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border bg-card shadow-sm">
          {upcomingDeadlines.length > 0 ? (
            <div>
              <div className="grid grid-cols-5 gap-2 border-b px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="col-span-2">Task</span>
                <span>Assigned to</span>
                <span>Department</span>
                <span className="text-right">Deadline</span>
              </div>
              <ul className="divide-y">
                {upcomingDeadlines.map((task) => (
                  <li
                    key={task.id}
                    className="grid grid-cols-5 items-center gap-2 px-5 py-3 text-sm transition-colors hover:bg-muted/40"
                  >
                    <div className="col-span-2 flex min-w-0 items-center gap-2">
                      <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium text-foreground">
                        {task.title}
                      </span>
                      <Badge
                        className={`shrink-0 border px-1.5 py-0 text-[10px] ${priorityColor[task.priority] ?? ""}`}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    <span className="truncate text-muted-foreground">
                      {task.assignedTo?.name ?? "Unassigned"}
                    </span>
                    <span className="truncate text-muted-foreground">
                      {DEPT_LABELS[task.department ?? ""] ?? "—"}
                    </span>
                    <span className="text-right font-medium text-foreground tabular-nums">
                      {task.deadline ? formatDate(task.deadline) : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No upcoming deadlines
            </p>
          )}
        </div>
      </section>

      {/* ── Section 6 — Quick actions ───────────────────────────────── */}
      <section>
        <SectionLabel icon={Zap}>Quick actions</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <QuickAction
            href="/dashboard/manager/team"
            icon={Users}
            title="My Team"
            subtitle="Members, roles and assignments"
          />
          <QuickAction
            href="/dashboard/manager/clients"
            icon={Building2}
            title="Client Pipeline"
            subtitle="Leads, active and inactive clients"
          />
          <QuickAction
            href="/dashboard/manager/performance"
            icon={Award}
            title="Team Performance"
            subtitle="Scores, rankings and trends"
          />
          <QuickAction
            href="/dashboard/reports"
            icon={BarChart3}
            title="Reports"
            subtitle="Analytics and exports"
          />
        </div>
      </section>

      {/* ── Section 7 — Recent activity ─────────────────────────────── */}
      <section>
        <SectionLabel icon={Clock}>Recent activity</SectionLabel>
        <div className="mt-3 overflow-hidden rounded-xl border bg-card shadow-sm">
          {hasActivity ? (
            <ul className="divide-y">
              {recentEmails.map((email) => (
                <li
                  key={`email-${email.id}`}
                  className="flex items-start gap-4 px-5 py-3 transition-colors hover:bg-muted/40"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cyan-50">
                    <Mail className="size-4 text-cyan-600" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {email.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      From {email.senderName ?? email.senderEmail}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {timeAgo(email.createdAt)}
                  </span>
                </li>
              ))}
              {recentCompletedTasks.map((task) => (
                <li
                  key={`task-${task.id}`}
                  className="flex items-start gap-4 px-5 py-3 transition-colors hover:bg-muted/40"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Completed by {task.assignedTo?.name ?? "Unassigned"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {task.completedAt ? timeAgo(task.completedAt) : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
                <Clock className="size-6 text-muted-foreground" />
              </span>
              <p className="mt-3 text-sm font-medium text-foreground">
                No recent activity
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Recent emails and completed tasks will appear here.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
