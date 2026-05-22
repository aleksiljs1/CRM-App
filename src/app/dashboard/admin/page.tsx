import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, ListTodo, Mail, FolderOpen } from "lucide-react";

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

const roleBadgeColor: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700 border-red-200",
  PARTNER: "bg-purple-100 text-purple-700 border-purple-200",
  MANAGER: "bg-blue-100 text-blue-700 border-blue-200",
  SENIOR: "bg-teal-100 text-teal-700 border-teal-200",
  ASSOCIATE: "bg-green-100 text-green-700 border-green-200",
  JUNIOR: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ASSISTANT: "bg-orange-100 text-orange-700 border-orange-200",
  INTERN: "bg-gray-100 text-gray-700 border-gray-200",
  CLIENT: "bg-slate-100 text-slate-700 border-slate-200",
};

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

  const roleCountMap = new Map<string, number>();
  usersByRole.forEach((r) => roleCountMap.set(r.role, r._count.id));

  const stats = [
    {
      label: "Total Users",
      value: totalUsers,
      icon: Users,
      detail: Array.from(roleCountMap.entries())
        .map(([role, count]) => `${role}: ${count}`)
        .join(", "),
    },
    {
      label: "Active Departments",
      value: departmentsActive.length,
      icon: FolderOpen,
      detail: null,
    },
    {
      label: "Total Clients",
      value: totalClients,
      icon: Building2,
      detail: null,
    },
    {
      label: "Total Tasks",
      value: totalTasks,
      icon: ListTodo,
      detail: null,
    },
    {
      label: "Total Emails",
      value: totalEmails,
      icon: Mail,
      detail: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          System Administration
        </h1>
        <p className="text-muted-foreground mt-1">
          System overview and user management
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00968a]/10">
                    <Icon className="h-5 w-5 text-[#00968a]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold leading-none">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.label}
                    </p>
                  </div>
                </div>
                {stat.detail && (
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                    {stat.detail}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({allUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {/* Table header */}
            <div className="grid grid-cols-5 text-xs font-medium text-muted-foreground pb-2 border-b">
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Department</span>
              <span className="text-center">Status</span>
            </div>
            {allUsers.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-5 items-center py-2.5 border-b last:border-0 text-sm"
              >
                <span className="font-medium truncate">{user.name}</span>
                <span className="text-muted-foreground truncate">
                  {user.email}
                </span>
                <span>
                  <Badge
                    className={`text-[10px] px-1.5 py-0 border ${roleBadgeColor[user.role] ?? ""}`}
                  >
                    {user.role}
                  </Badge>
                </span>
                <span className="text-muted-foreground">
                  {user.department
                    ? DEPT_LABELS[user.department] ?? user.department
                    : "\u2014"}
                </span>
                <span className="flex justify-center">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
