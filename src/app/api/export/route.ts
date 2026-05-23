import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPerformanceData } from "@/app/api/performance/route";
import ExcelJS from "exceljs";
import type { Department } from "@/generated/prisma/enums";

const ALLOWED_ROLES = ["ADMIN", "PARTNER", "MANAGER"];

function applyHeaderStyle(sheet: ExcelJS.Worksheet) {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF00968A" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 28;
}

function applyAutoFilter(sheet: ExcelJS.Worksheet) {
  const lastCol = sheet.columns.length;
  const lastColLetter = String.fromCharCode(64 + Math.min(lastCol, 26));
  sheet.autoFilter = { from: "A1", to: `${lastColLetter}1` };
}

function makeResponse(buffer: ExcelJS.Buffer, type: string) {
  const date = new Date().toISOString().split("T")[0];
  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="kreston_${type}_${date}.xlsx"`,
    },
  });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, department } = session.user;

    if (!ALLOWED_ROLES.includes(role)) {
      return Response.json(
        { error: "Forbidden: only ADMIN, PARTNER, or MANAGER can export" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type } = body;

    const isAdmin = role === "ADMIN" || role === "PARTNER";

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Kreston CRM";
    workbook.created = new Date();

    // ── PERFORMANCE ──────────────────────────────────────────────────
    if (type === "performance") {
      let data = await getPerformanceData();

      if (!isAdmin && department) {
        data = data.filter((d) => d.user.department === department);
      }

      const sheet = workbook.addWorksheet("Performance Scores");
      sheet.columns = [
        { header: "Rank", key: "rank", width: 8 },
        { header: "Name", key: "name", width: 25 },
        { header: "Role", key: "role", width: 14 },
        { header: "Sub-Role", key: "subRole", width: 18 },
        { header: "Department", key: "department", width: 22 },
        { header: "Score", key: "score", width: 10 },
        { header: "Tasks Completed", key: "tasksCompleted", width: 16 },
        { header: "Total Tasks", key: "totalTasks", width: 14 },
        { header: "On-Time %", key: "onTimeRate", width: 12 },
        { header: "High Priority Done", key: "highPriorityCompleted", width: 18 },
        { header: "Emails Handled", key: "emailsHandled", width: 16 },
        { header: "Clients Managed", key: "clientsManaged", width: 16 },
        { header: "Avg Pickup Hours", key: "avgPickupTime", width: 16 },
        { header: "Avg Cycle Hours", key: "avgCycleTime", width: 16 },
        { header: "Revisions", key: "revisionCount", width: 12 },
      ];

      data.forEach((item, idx) => {
        sheet.addRow({
          rank: idx + 1,
          name: item.user.name,
          role: item.user.role,
          subRole: (item.user as any).subRole || "",
          department: item.user.department || "",
          score: item.performanceScore,
          tasksCompleted: item.tasksCompleted,
          totalTasks: item.totalTasks,
          onTimeRate: item.onTimeRate,
          highPriorityCompleted: item.highPriorityCompleted,
          emailsHandled: item.emailsHandled,
          clientsManaged: item.clientsManaged,
          avgPickupTime: item.avgPickupTime,
          avgCycleTime: item.avgCycleTime,
          revisionCount: item.revisionCount,
        });
      });

      applyHeaderStyle(sheet);
      applyAutoFilter(sheet);
      const buffer = await workbook.xlsx.writeBuffer();
      return makeResponse(buffer, type);
    }

    // ── TEAM ─────────────────────────────────────────────────────────
    if (type === "team") {
      const whereUsers: Record<string, unknown> = {
        role: { not: "CLIENT" },
        isActive: true,
      };

      if (!isAdmin && department) {
        whereUsers.department = department;
      }

      const users = await prisma.user.findMany({
        where: whereUsers,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          subRole: true,
          department: true,
        },
        orderBy: { name: "asc" },
      });

      const team = await Promise.all(
        users.map(async (user) => {
          const [totalTasks, completedTasks, inProgressTasks, overdueTasks, emailsHandled] =
            await Promise.all([
              prisma.task.count({ where: { assignedToId: user.id } }),
              prisma.task.count({
                where: { assignedToId: user.id, status: "COMPLETED" },
              }),
              prisma.task.count({
                where: { assignedToId: user.id, status: "IN_PROGRESS" },
              }),
              prisma.task.count({
                where: {
                  assignedToId: user.id,
                  status: { not: "COMPLETED" },
                  deadline: { lt: new Date() },
                },
              }),
              prisma.email.count({
                where: { userId: user.id, isIncoming: false },
              }),
            ]);

          const completionRate =
            totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          return { user, totalTasks, completedTasks, inProgressTasks, overdueTasks, completionRate, emailsHandled };
        })
      );

      const sheet = workbook.addWorksheet("Team Members");
      sheet.columns = [
        { header: "Name", key: "name", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Role", key: "role", width: 14 },
        { header: "Sub-Role", key: "subRole", width: 18 },
        { header: "Department", key: "department", width: 22 },
        { header: "Total Tasks", key: "totalTasks", width: 14 },
        { header: "Completed", key: "completedTasks", width: 12 },
        { header: "In Progress", key: "inProgressTasks", width: 14 },
        { header: "Overdue", key: "overdueTasks", width: 10 },
        { header: "Completion Rate %", key: "completionRate", width: 18 },
        { header: "Emails Handled", key: "emailsHandled", width: 16 },
      ];

      team.forEach((m) => {
        sheet.addRow({
          name: m.user.name,
          email: m.user.email,
          role: m.user.role,
          subRole: m.user.subRole || "",
          department: m.user.department || "",
          totalTasks: m.totalTasks,
          completedTasks: m.completedTasks,
          inProgressTasks: m.inProgressTasks,
          overdueTasks: m.overdueTasks,
          completionRate: m.completionRate,
          emailsHandled: m.emailsHandled,
        });
      });

      applyHeaderStyle(sheet);
      applyAutoFilter(sheet);
      const buffer = await workbook.xlsx.writeBuffer();
      return makeResponse(buffer, type);
    }

    // ── TASKS ────────────────────────────────────────────────────────
    if (type === "tasks") {
      const where: Record<string, unknown> = {};
      if (!isAdmin && department) {
        where.department = department;
      }

      const tasks = await prisma.task.findMany({
        where,
        include: {
          assignedTo: { select: { name: true } },
          createdBy: { select: { name: true } },
          client: { select: { companyName: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const sheet = workbook.addWorksheet("Tasks");
      sheet.columns = [
        { header: "Title", key: "title", width: 35 },
        { header: "Status", key: "status", width: 14 },
        { header: "Priority", key: "priority", width: 12 },
        { header: "Assigned To", key: "assignedTo", width: 22 },
        { header: "Created By", key: "createdBy", width: 22 },
        { header: "Client", key: "client", width: 22 },
        { header: "Department", key: "department", width: 20 },
        { header: "Deadline", key: "deadline", width: 18 },
        { header: "Created", key: "created", width: 18 },
        { header: "Completed", key: "completed", width: 18 },
        { header: "Time in Progress (hrs)", key: "hoursInProgress", width: 22 },
      ];

      tasks.forEach((t) => {
        const hoursInProgress =
          t.completedAt && t.createdAt
            ? Math.round(
                ((t.completedAt.getTime() - t.createdAt.getTime()) /
                  (1000 * 60 * 60)) *
                  10
              ) / 10
            : "";

        sheet.addRow({
          title: t.title,
          status: t.status,
          priority: t.priority,
          assignedTo: t.assignedTo?.name || "Unassigned",
          createdBy: t.createdBy?.name || "",
          client: t.client?.companyName || "",
          department: t.department || "",
          deadline: t.deadline
            ? t.deadline.toISOString().split("T")[0]
            : "",
          created: t.createdAt.toISOString().split("T")[0],
          completed: t.completedAt
            ? t.completedAt.toISOString().split("T")[0]
            : "",
          hoursInProgress,
        });
      });

      applyHeaderStyle(sheet);
      applyAutoFilter(sheet);
      const buffer = await workbook.xlsx.writeBuffer();
      return makeResponse(buffer, type);
    }

    // ── EMAILS ───────────────────────────────────────────────────────
    if (type === "emails") {
      const where: Record<string, unknown> = {};
      if (!isAdmin && department) {
        where.recipientDept = department;
      }

      const emails = await prisma.email.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      const sheet = workbook.addWorksheet("Emails");
      sheet.columns = [
        { header: "From", key: "from", width: 28 },
        { header: "Subject", key: "subject", width: 40 },
        { header: "Department", key: "department", width: 20 },
        { header: "Received", key: "received", width: 18 },
        { header: "Read", key: "read", width: 8 },
        { header: "Replied", key: "replied", width: 10 },
        { header: "Replied At", key: "repliedAt", width: 18 },
        { header: "AI Importance", key: "aiImportance", width: 16 },
      ];

      emails.forEach((e) => {
        sheet.addRow({
          from: e.senderName || e.senderEmail,
          subject: e.subject,
          department: e.recipientDept || "",
          received: e.createdAt.toISOString().split("T")[0],
          read: e.isRead ? "Yes" : "No",
          replied: e.isReplied ? "Yes" : "No",
          repliedAt: e.repliedAt
            ? e.repliedAt.toISOString().split("T")[0]
            : "",
          aiImportance: e.aiImportance ?? "",
        });
      });

      applyHeaderStyle(sheet);
      applyAutoFilter(sheet);
      const buffer = await workbook.xlsx.writeBuffer();
      return makeResponse(buffer, type);
    }

    // ── CLIENTS ──────────────────────────────────────────────────────
    if (type === "clients") {
      const where: Record<string, unknown> = {};
      if (!isAdmin && department) {
        where.assignedTo = { department };
      }

      const clients = await prisma.client.findMany({
        where,
        include: {
          assignedTo: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
      });

      const sheet = workbook.addWorksheet("Clients");
      sheet.columns = [
        { header: "Company", key: "company", width: 30 },
        { header: "Contact Name", key: "contactName", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Phone", key: "phone", width: 18 },
        { header: "Industry", key: "industry", width: 18 },
        { header: "Status", key: "status", width: 12 },
        { header: "Assigned To", key: "assignedTo", width: 22 },
        { header: "Created", key: "created", width: 18 },
      ];

      clients.forEach((c) => {
        sheet.addRow({
          company: c.companyName,
          contactName: c.contactName,
          email: c.contactEmail,
          phone: c.phone || "",
          industry: c.industry || "",
          status: c.status,
          assignedTo: c.assignedTo?.name || "Unassigned",
          created: c.createdAt.toISOString().split("T")[0],
        });
      });

      applyHeaderStyle(sheet);
      applyAutoFilter(sheet);
      const buffer = await workbook.xlsx.writeBuffer();
      return makeResponse(buffer, type);
    }

    // ── PERFORMANCE REPORT ───────────────────────────────────────────
    if (type === "performance-report") {
      const { reportId } = body;
      if (!reportId) {
        return Response.json({ error: "reportId is required" }, { status: 400 });
      }

      const report = await prisma.performanceReport.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        return Response.json({ error: "Report not found" }, { status: 404 });
      }

      const reportData = report.report as {
        employees?: {
          userId: string;
          name: string;
          score: number;
          summary: string;
          managerTips: string;
          completedTasks?: { title: string }[];
        }[];
      };

      const sheet = workbook.addWorksheet("Performance Report");
      sheet.columns = [
        { header: "Name", key: "name", width: 25 },
        { header: "Score", key: "score", width: 10 },
        { header: "Summary", key: "summary", width: 50 },
        { header: "Manager Tips", key: "managerTips", width: 50 },
        { header: "Tasks Completed", key: "tasksCompleted", width: 40 },
      ];

      const employees = reportData.employees || [];
      employees.forEach((emp) => {
        sheet.addRow({
          name: emp.name,
          score: emp.score,
          summary: emp.summary,
          managerTips: emp.managerTips,
          tasksCompleted: (emp.completedTasks || [])
            .map((t) => t.title)
            .join("; "),
        });
      });

      applyHeaderStyle(sheet);
      applyAutoFilter(sheet);
      const buffer = await workbook.xlsx.writeBuffer();
      return makeResponse(buffer, type);
    }

    // ── DASHBOARD KPIs ───────────────────────────────────────────────
    if (type === "dashboard-kpis") {
      const dept = (department || "HR") as Department;
      const deptFilter = isAdmin
        ? {}
        : { department: dept };
      const taskDeptFilter = isAdmin
        ? {}
        : { department: dept };
      const emailDeptFilter = isAdmin
        ? {}
        : { recipientDept: dept };

      const [
        totalEmployees,
        activeClients,
        openTasks,
        totalTasks,
        completedTasks,
        unreadEmails,
        pendingSubmissions,
      ] = await Promise.all([
        prisma.user.count({
          where: { isActive: true, role: { not: "CLIENT" }, ...deptFilter },
        }),
        prisma.client.count({
          where: {
            status: "ACTIVE",
            ...(isAdmin
              ? {}
              : { assignedTo: { department: dept } }),
          },
        }),
        prisma.task.count({
          where: { status: { not: "COMPLETED" }, ...taskDeptFilter },
        }),
        prisma.task.count({ where: { ...taskDeptFilter } }),
        prisma.task.count({
          where: { status: "COMPLETED", ...taskDeptFilter },
        }),
        prisma.email.count({
          where: { isIncoming: true, isRead: false, ...emailDeptFilter },
        }),
        prisma.clientSubmission.count({
          where: {
            status: { in: ["INCOMPLETE", "UNDER_REVIEW"] },
            ...(isAdmin
              ? {}
              : {
                  processType: {
                    department: dept,
                  },
                }),
          },
        }),
      ]);

      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const sheet = workbook.addWorksheet("Dashboard KPIs");
      sheet.columns = [
        { header: "Metric", key: "metric", width: 30 },
        { header: "Value", key: "value", width: 20 },
      ];

      const kpis = [
        { metric: "Total Employees", value: totalEmployees },
        { metric: "Active Clients", value: activeClients },
        { metric: "Open Tasks", value: openTasks },
        { metric: "Completion Rate %", value: `${completionRate}%` },
        { metric: "Unread Emails", value: unreadEmails },
        { metric: "Pending Submissions", value: pendingSubmissions },
      ];

      kpis.forEach((kpi) => {
        sheet.addRow(kpi);
      });

      applyHeaderStyle(sheet);
      applyAutoFilter(sheet);
      const buffer = await workbook.xlsx.writeBuffer();
      return makeResponse(buffer, type);
    }

    return Response.json(
      { error: `Unknown export type: ${type}` },
      { status: 400 }
    );
  } catch (error) {
    console.error("Export error:", error);
    return Response.json({ error: "Export failed" }, { status: 500 });
  }
}
