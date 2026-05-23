import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "ADMIN") {
    return { error: Response.json({ error: "Forbidden: ADMIN only" }, { status: 403 }) };
  }
  return { session };
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    // Fetch all staff users
    const users = await prisma.user.findMany({
      where: { isActive: true, role: { not: "CLIENT" } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
    });

    // Fetch all tasks
    const allTasks = await prisma.task.findMany({
      select: {
        id: true,
        status: true,
        priority: true,
        deadline: true,
        completedAt: true,
        createdAt: true,
        department: true,
        assignedToId: true,
        title: true,
      },
    });

    // Fetch all emails for volume metric
    const emailCounts = await prisma.email.groupBy({
      by: ["userId"],
      where: { isIncoming: false, userId: { not: null } },
      _count: { id: true },
    });
    const emailMap = new Map(emailCounts.map((e) => [e.userId, e._count.id]));

    // Fetch pickup speed records
    const pickupRecords = await prisma.taskStatusHistory.findMany({
      where: { toStatus: "IN_PROGRESS", fromStatus: "TODO" },
      include: { task: { select: { assignedToId: true, createdAt: true } } },
    });

    // Fetch revision counts
    const revisionRecords = await prisma.taskStatusHistory.findMany({
      where: { toStatus: "IN_PROGRESS", fromStatus: "REVIEW" },
      include: { task: { select: { assignedToId: true } } },
    });

    // Build per-user pickup speed map
    const pickupByUser = new Map<string, number[]>();
    for (const r of pickupRecords) {
      const uid = r.task.assignedToId;
      if (!uid) continue;
      const hours =
        (r.changedAt.getTime() - r.task.createdAt.getTime()) / (1000 * 60 * 60);
      if (!pickupByUser.has(uid)) pickupByUser.set(uid, []);
      pickupByUser.get(uid)!.push(hours);
    }

    // Build per-user revision count map
    const revisionByUser = new Map<string, number>();
    for (const r of revisionRecords) {
      const uid = r.task.assignedToId;
      if (!uid) continue;
      revisionByUser.set(uid, (revisionByUser.get(uid) || 0) + 1);
    }

    // Department enum values
    const departments = [
      "AUDIT",
      "ACCOUNTING_TAX",
      "BOOKKEEPING_PAYROLL",
      "LEGAL",
      "ADVISORY",
      "HR",
      "MARKETING",
      "FINANCE",
    ];

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

    const now = new Date();

    // ── Department comparison ──
    const departmentStats = departments.map((dept) => {
      const deptUsers = users.filter((u) => u.department === dept);
      const deptTasks = allTasks.filter((t) => t.department === dept);
      const employeeCount = deptUsers.length;
      const openTasks = deptTasks.filter(
        (t) => t.status !== "COMPLETED"
      ).length;
      const completedTasks = deptTasks.filter(
        (t) => t.status === "COMPLETED"
      ).length;
      const totalTasks = deptTasks.length;
      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const avgTasksPerEmployee =
        employeeCount > 0
          ? Math.round((openTasks / employeeCount) * 10) / 10
          : 0;
      const overdueTasks = deptTasks.filter(
        (t) =>
          t.status !== "COMPLETED" &&
          t.deadline &&
          new Date(t.deadline) < now
      ).length;

      return {
        department: dept,
        label: DEPT_LABELS[dept] || dept,
        employeeCount,
        openTasks,
        completedTasks,
        totalTasks,
        completionRate,
        avgTasksPerEmployee,
        overdueTasks,
      };
    }).filter((d) => d.employeeCount > 0 || d.totalTasks > 0);

    // ── Per-user performance scores ──
    const userPerformance = users.map((user) => {
      const userTasks = allTasks.filter((t) => t.assignedToId === user.id);
      const totalTasks = userTasks.length;
      const completedTasks = userTasks.filter(
        (t) => t.status === "COMPLETED"
      );
      const tasksCompleted = completedTasks.length;

      // Completion rate
      const completionRate =
        totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;

      // On-time rate
      let onTimeCount = 0;
      for (const task of completedTasks) {
        if (!task.deadline) {
          onTimeCount++;
        } else if (task.completedAt && task.completedAt <= task.deadline) {
          onTimeCount++;
        }
      }
      const onTimeRate =
        tasksCompleted > 0
          ? Math.round((onTimeCount / tasksCompleted) * 100)
          : 100;

      // High priority ratio
      const highPriorityCompleted = completedTasks.filter(
        (t) => t.priority === "HIGH" || t.priority === "URGENT"
      ).length;
      const highPriorityRatio =
        tasksCompleted > 0
          ? (highPriorityCompleted / tasksCompleted) * 100
          : 0;

      // Throughput (avg tasks per month)
      let monthsActive = 1;
      if (userTasks.length > 0) {
        const firstDate = userTasks.reduce(
          (min, t) => (t.createdAt < min ? t.createdAt : min),
          userTasks[0].createdAt
        );
        const monthsDiff =
          (Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        monthsActive = Math.max(1, Math.floor(monthsDiff));
      }
      const throughput =
        Math.round((tasksCompleted / monthsActive) * 10) / 10;

      // Email volume
      const emailsHandled = emailMap.get(user.id) || 0;

      // Pickup speed
      const pickups = pickupByUser.get(user.id) || [];
      const avgPickupTime =
        pickups.length > 0
          ? pickups.reduce((a, b) => a + b, 0) / pickups.length
          : 0;
      const pickupSpeed = Math.max(0, 100 - avgPickupTime * 2);

      // Quality score (revisions)
      const revisions = revisionByUser.get(user.id) || 0;
      const qualityScore = Math.max(0, 100 - revisions * 20);

      // Performance score
      const performanceScore = Math.round(
        completionRate * 0.25 +
          onTimeRate * 0.2 +
          highPriorityRatio * 0.15 +
          Math.min(throughput * 5, 100) * 0.1 +
          Math.min(emailsHandled * 2, 100) * 0.1 +
          pickupSpeed * 0.1 +
          qualityScore * 0.1
      );

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
        },
        performanceScore,
        tasksCompleted,
        totalTasks,
        completionRate: Math.round(completionRate),
        onTimeRate,
      };
    });

    // Sort by score desc, top 10
    const topPerformers = [...userPerformance]
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 10);

    // ── Department health ──
    const departmentHealth = departmentStats.map((d) => {
      let status: "Underloaded" | "Balanced" | "Overloaded";
      if (d.avgTasksPerEmployee < 2) status = "Underloaded";
      else if (d.avgTasksPerEmployee <= 5) status = "Balanced";
      else status = "Overloaded";

      return {
        department: d.department,
        label: d.label,
        employeeCount: d.employeeCount,
        avgTasksPerEmployee: d.avgTasksPerEmployee,
        status,
      };
    });

    // ── Overdue tasks alert ──
    const overdueTasks = allTasks
      .filter(
        (t) =>
          t.status !== "COMPLETED" &&
          t.deadline &&
          new Date(t.deadline) < now
      )
      .map((t) => {
        const assignee = users.find((u) => u.id === t.assignedToId);
        const daysOverdue = Math.ceil(
          (now.getTime() - new Date(t.deadline!).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return {
          id: t.id,
          title: t.title,
          department: t.department,
          departmentLabel: t.department
            ? DEPT_LABELS[t.department] || t.department
            : "Unassigned",
          assignedTo: assignee?.name || "Unassigned",
          deadline: t.deadline,
          daysOverdue,
        };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);

    return Response.json({
      departmentStats,
      topPerformers,
      departmentHealth,
      overdueTasks,
    });
  } catch (error) {
    console.error("Error computing admin performance:", error);
    return Response.json(
      { error: "Failed to compute performance data" },
      { status: 500 }
    );
  }
}
