import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Mail,
  Sparkles,
  Building2,
  Users,
  Database,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";

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

function StatusBadge({ configured }: { configured: boolean }) {
  return configured ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
      <CheckCircle2 className="size-3" />
      Configured
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
      <XCircle className="size-3" />
      Not configured
    </span>
  );
}

export default async function SystemSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Environment checks (never expose actual values)
  const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER);
  const smtpHost = process.env.SMTP_HOST ? "Set" : "Not set";
  const smtpUser = process.env.SMTP_USER ? "Set" : "Not set";

  const geminiConfigured = !!process.env.GEMINI_API_KEY;
  const geminiModel = "gemini-2.5-flash";

  // Database queries
  const [
    totalUsers,
    activeUsers,
    usersByRole,
    totalClients,
    totalTasks,
    totalEmails,
    totalNotifications,
    departmentSettings,
    deptUserCounts,
    deptTaskCounts,
    deptClientCounts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.groupBy({
      by: ["role"],
      _count: { id: true },
    }),
    prisma.client.count(),
    prisma.task.count(),
    prisma.email.count(),
    prisma.notification.count(),
    prisma.departmentSettings.findMany({
      orderBy: { department: "asc" },
    }),
    prisma.user.groupBy({
      by: ["department"],
      where: { department: { not: null } },
      _count: { id: true },
    }),
    prisma.task.groupBy({
      by: ["department"],
      where: { department: { not: null }, status: { not: "COMPLETED" } },
      _count: { id: true },
    }),
    prisma.client.groupBy({
      by: ["assignedToId"],
      _count: { id: true },
    }),
  ]);

  const inactiveUsers = totalUsers - activeUsers;

  // Build department overview
  const departments = Object.keys(DEPT_LABELS);
  const deptUserMap = Object.fromEntries(
    deptUserCounts.map((d) => [d.department, d._count.id])
  );
  const deptTaskMap = Object.fromEntries(
    deptTaskCounts.map((d) => [d.department, d._count.id])
  );
  const deptSettingsMap = Object.fromEntries(
    departmentSettings.map((s) => [s.department, s.autoAssignReviewHours])
  );

  // For client count per department, we need users per dept then count clients
  // This is an approximation - we count clients assigned to users in each dept
  const usersWithDept = await prisma.user.findMany({
    where: { department: { not: null } },
    select: { id: true, department: true },
  });
  const userDeptMap = Object.fromEntries(
    usersWithDept.map((u) => [u.id, u.department])
  );
  const deptClientMap: Record<string, number> = {};
  for (const c of deptClientCounts) {
    if (c.assignedToId && userDeptMap[c.assignedToId]) {
      const dept = userDeptMap[c.assignedToId] as string;
      deptClientMap[dept] = (deptClientMap[dept] || 0) + c._count.id;
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-brand-700 dark:text-brand-400">
          System Settings
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Read-only overview of system configuration and statistics
        </p>
      </div>

      {/* SMTP Status */}
      <section>
        <SectionLabel icon={Mail}>SMTP Configuration</SectionLabel>
        <div className="mt-3 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Email Delivery
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Outbound email transport status
              </p>
            </div>
            <StatusBadge configured={smtpConfigured} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                SMTP Host
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {smtpHost}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                SMTP User
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {smtpUser}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Status */}
      <section>
        <SectionLabel icon={Sparkles}>AI Configuration</SectionLabel>
        <div className="mt-3 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Gemini AI
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                AI-powered features status
              </p>
            </div>
            <StatusBadge configured={geminiConfigured} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                API Key
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {geminiConfigured ? "Set" : "Not set"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Model
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {geminiModel}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Department Overview */}
      <section>
        <SectionLabel icon={Building2}>Department Overview</SectionLabel>
        <div className="mt-3 overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Department
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                    Employees
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                    Active Tasks
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                    Clients
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                    Auto-Assign Review (hrs)
                  </th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, idx) => (
                  <tr key={dept} className={idx > 0 ? "border-t" : ""}>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {DEPT_LABELS[dept]}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                      {deptUserMap[dept] ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                      {deptTaskMap[dept] ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                      {deptClientMap[dept] ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                      {deptSettingsMap[dept] ?? 24}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* User Stats */}
      <section>
        <SectionLabel icon={Users}>User Statistics</SectionLabel>
        <div className="mt-3 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-5 shadow-sm border-t-4 border-t-brand-500">
              <p className="text-[28px] font-bold tabular-nums leading-none text-foreground">
                {totalUsers}
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                Total Users
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5 shadow-sm border-t-4 border-t-emerald-500">
              <p className="text-[28px] font-bold tabular-nums leading-none text-foreground">
                {activeUsers}
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                Active
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5 shadow-sm border-t-4 border-t-amber-500">
              <p className="text-[28px] font-bold tabular-nums leading-none text-foreground">
                {inactiveUsers}
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                Inactive
              </p>
            </div>
          </div>

          {/* Role breakdown */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Breakdown by Role
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {usersByRole
                .sort((a, b) => b._count.id - a._count.id)
                .map((r) => (
                  <div
                    key={r.role}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <span className="text-xs font-medium text-foreground">
                      {r.role}
                    </span>
                    <span className="text-xs font-bold tabular-nums text-brand-600 dark:text-brand-400">
                      {r._count.id}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Database Stats */}
      <section>
        <SectionLabel icon={Database}>Database Statistics</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Users", count: totalUsers },
            { label: "Clients", count: totalClients },
            { label: "Tasks", count: totalTasks },
            { label: "Emails", count: totalEmails },
            { label: "Notifications", count: totalNotifications },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border bg-card p-4 shadow-sm"
            >
              <p className="text-xl font-bold tabular-nums leading-tight text-foreground">
                {stat.count.toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
