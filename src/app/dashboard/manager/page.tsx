import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TasksByDepartmentChart,
  ClientPipelineChart,
} from "@/components/dashboard-charts";
import {
  Users,
  Building2,
  ListTodo,
  CheckCircle2,
  Mail,
  FileText,
  Clock,
  CalendarDays,
} from "lucide-react";

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

  // KPI card data
  const kpis = [
    {
      label: "Total Employees",
      value: totalEmployees,
      icon: Users,
      format: (v: number) => v.toString(),
    },
    {
      label: "Active Clients",
      value: activeClients,
      icon: Building2,
      format: (v: number) => v.toString(),
    },
    {
      label: "Open Tasks",
      value: openTasks,
      icon: ListTodo,
      format: (v: number) => v.toString(),
    },
    {
      label: "Completion Rate",
      value: completionRate,
      icon: CheckCircle2,
      format: (v: number) => `${v}%`,
    },
    {
      label: "Unread Emails",
      value: unreadEmails,
      icon: Mail,
      format: (v: number) => v.toString(),
    },
    {
      label: "Pending Submissions",
      value: pendingSubmissions,
      icon: FileText,
      format: (v: number) => v.toString(),
    },
  ];

  // Priority badge colors
  const priorityColor: Record<string, string> = {
    URGENT: "bg-red-100 text-red-700 border-red-200",
    HIGH: "bg-orange-100 text-orange-700 border-orange-200",
    MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
    LOW: "bg-green-100 text-green-700 border-green-200",
  };

  const deptDisplayName = isAdmin
    ? "Firm-Wide"
    : getDeptName(department);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {deptDisplayName} Management Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin
            ? "Firm-wide overview and analytics"
            : `Department overview for ${deptDisplayName}`}
        </p>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00968a]/10">
                    <Icon className="h-5 w-5 text-[#00968a]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold leading-none">
                      {kpi.format(kpi.value)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {kpi.label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Department</CardTitle>
          </CardHeader>
          <CardContent>
            {tasksByDeptChart.length > 0 ? (
              <TasksByDepartmentChart data={tasksByDeptChart} />
            ) : (
              <p className="text-muted-foreground text-sm text-center py-12">
                No task data available
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {clientPipelineChart.length > 0 ? (
              <ClientPipelineChart data={clientPipelineChart} />
            ) : (
              <p className="text-muted-foreground text-sm text-center py-12">
                No client data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Department Workload + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department Workload */}
        <Card>
          <CardHeader>
            <CardTitle>Department Workload</CardTitle>
          </CardHeader>
          <CardContent>
            {departmentWorkload.length > 0 ? (
              <div className="space-y-0">
                {/* Table header */}
                <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground pb-2 border-b">
                  <span>Department</span>
                  <span className="text-center">Staff</span>
                  <span className="text-center">Open Tasks</span>
                  <span className="text-center">Ratio</span>
                </div>
                {departmentWorkload.map((d) => {
                  const ratioColor =
                    d.ratio < 3
                      ? "text-green-600 bg-green-50"
                      : d.ratio <= 5
                        ? "text-amber-600 bg-amber-50"
                        : "text-red-600 bg-red-50";
                  return (
                    <div
                      key={d.dept}
                      className="grid grid-cols-4 items-center py-2.5 border-b last:border-0 text-sm"
                    >
                      <span className="font-medium">{d.label}</span>
                      <span className="text-center text-muted-foreground">
                        {d.employees}
                      </span>
                      <span className="text-center text-muted-foreground">
                        {d.tasks}
                      </span>
                      <span className="flex justify-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ratioColor}`}
                        >
                          {d.ratio === 999 ? "N/A" : d.ratio.toFixed(1)}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                No department data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {recentEmails.map((email) => (
                <div
                  key={email.id}
                  className="flex items-start gap-3 py-2 border-b last:border-0"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 mt-0.5">
                    <Mail className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {email.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      From {email.senderName ?? email.senderEmail}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {timeAgo(email.createdAt)}
                  </span>
                </div>
              ))}

              {recentEmails.length > 0 && recentCompletedTasks.length > 0 && (
                <Separator className="my-2" />
              )}

              {recentCompletedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 py-2 border-b last:border-0"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50 mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Completed by {task.assignedTo?.name ?? "Unassigned"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {task.completedAt ? timeAgo(task.completedAt) : ""}
                  </span>
                </div>
              ))}

              {recentEmails.length === 0 &&
                recentCompletedTasks.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    No recent activity
                  </p>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#00968a]" />
            Upcoming Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingDeadlines.length > 0 ? (
            <div className="space-y-0">
              {/* Table header */}
              <div className="grid grid-cols-5 text-xs font-medium text-muted-foreground pb-2 border-b">
                <span className="col-span-2">Task</span>
                <span>Assigned To</span>
                <span>Department</span>
                <span className="text-right">Deadline</span>
              </div>
              {upcomingDeadlines.map((task) => (
                <div
                  key={task.id}
                  className="grid grid-cols-5 items-center py-2.5 border-b last:border-0 text-sm"
                >
                  <div className="col-span-2 flex items-center gap-2 min-w-0">
                    <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium truncate">{task.title}</span>
                    <Badge
                      className={`shrink-0 text-[10px] px-1.5 py-0 border ${priorityColor[task.priority] ?? ""}`}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground">
                    {task.assignedTo?.name ?? "Unassigned"}
                  </span>
                  <span className="text-muted-foreground">
                    {DEPT_LABELS[task.department ?? ""] ?? "\u2014"}
                  </span>
                  <span className="text-right font-medium">
                    {task.deadline ? formatDate(task.deadline) : "\u2014"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">
              No upcoming deadlines
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
