import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Users, CheckSquare, FileText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

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

export default async function HRDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const department = session.user.department;
  const role = session.user.role;
  const isAdmin = role === "ADMIN" || role === "PARTNER";

  // Build department filter for queries
  const deptFilter = isAdmin ? {} : { recipientDept: department || "HR" };
  const taskDeptFilter = isAdmin ? {} : { department: department || "HR" };

  const [unreadEmailCount, totalClients, pendingTasks, openProcesses, recentEmails] =
    await Promise.all([
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
    ]);

  const deptDisplayName = getDeptName(department);

  const stats = [
    {
      label: "Unread Emails",
      value: unreadEmailCount,
      icon: Mail,
      href: "/dashboard/hr/emails",
    },
    {
      label: "Total Clients",
      value: totalClients,
      icon: Users,
      href: "/dashboard/hr/clients",
    },
    {
      label: "Pending Tasks",
      value: pendingTasks,
      icon: CheckSquare,
      href: "/dashboard/hr/tasks",
    },
    {
      label: "Open Processes",
      value: openProcesses,
      icon: FileText,
      href: "/dashboard/hr/processes",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{deptDisplayName} Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-5 w-5" style={{ color: "#00968a" }} />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Unread Emails */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Unread Emails</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEmails.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No unread emails. You&apos;re all caught up!
            </p>
          ) : (
            <div className="space-y-4">
              {recentEmails.map((email) => {
                const isUrgent = /urgent/i.test(email.subject);
                return (
                  <Link
                    key={email.id}
                    href="/dashboard/hr/emails"
                    className="flex items-start justify-between rounded-md border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium leading-none">
                          {email.senderName || email.senderEmail}
                        </p>
                        {isUrgent && (
                          <Badge variant="destructive" className="text-xs">
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {email.subject}
                      </p>
                    </div>
                    <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                      {timeAgo(email.createdAt)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link href="/dashboard/hr/emails">
          <Button style={{ backgroundColor: "#00968a", color: "white" }}>
            View All Emails
          </Button>
        </Link>
        <Link href="/dashboard/hr/tasks">
          <Button variant="outline">View Tasks</Button>
        </Link>
      </div>
    </div>
  );
}
