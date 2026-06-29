import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notify";

/**
 * POST /api/tasks/auto-assign
 *
 * Auto-assigns ANY unassigned active task that has been sitting in its current
 * status longer than the department's threshold (DepartmentSettings
 * .autoAssignReviewHours, default 24h). It picks the least-busy eligible person
 * in that department so work is load-balanced instead of stalling.
 *
 * - REVIEW tasks  -> assigned to the SENIOR/ASSOCIATE with the fewest review tasks
 * - TODO / IN_PROGRESS tasks -> assigned to the doer (SENIOR/ASSOCIATE/JUNIOR/
 *   ASSISTANT/INTERN) with the fewest active tasks
 *
 * Terminal statuses (APPROVED, COMPLETED) are ignored.
 *
 * Runs on: manual trigger (manager button) and the background poller interval.
 */

const DEFAULT_AUTO_ASSIGN_HOURS = 24;
const ACTIVE_STATUSES = ["TODO", "IN_PROGRESS", "REVIEW"] as const;

// Who can pick up a task, by the status it is waiting in.
const REVIEWER_ROLES = ["SENIOR", "ASSOCIATE"] as const;
const DOER_ROLES = ["SENIOR", "ASSOCIATE", "JUNIOR", "ASSISTANT", "INTERN"] as const;

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Per-department thresholds (hours).
    const allSettings = await prisma.departmentSettings.findMany();
    const settingsMap = new Map(
      allSettings.map((s) => [s.department, s.autoAssignReviewHours])
    );

    // All unassigned tasks still in an active status.
    const unassigned = await prisma.task.findMany({
      where: {
        status: { in: ACTIVE_STATUSES as unknown as string[] },
        assignedToId: null,
      },
      include: {
        // Most recent time the task entered its CURRENT status.
        statusHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    // Keep only tasks that have waited longer than their department threshold.
    const overdue = unassigned.filter((task) => {
      if (!task.department) return false;
      // When did it enter its current status? Fall back to creation time.
      const entered =
        task.statusHistory.find((h) => h.toStatus === task.status)?.changedAt ||
        task.createdAt;
      const hours =
        settingsMap.get(task.department as any) ?? DEFAULT_AUTO_ASSIGN_HOURS;
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      return new Date(entered) < cutoff;
    });

    if (overdue.length === 0) {
      return Response.json({ assigned: 0, message: "No overdue tasks" });
    }

    const assigned: { taskId: string; taskTitle: string; assignedTo: string }[] = [];

    for (const task of overdue) {
      const dept = task.department;
      if (!dept) continue;

      const isReview = task.status === "REVIEW";
      const roles = (isReview ? REVIEWER_ROLES : DOER_ROLES) as unknown as string[];
      // Balance review tasks by review load; other tasks by total active load.
      const loadStatuses = isReview
        ? ["REVIEW"]
        : (ACTIVE_STATUSES as unknown as string[]);

      // Find eligible people in the department, least-busy first.
      const candidates = await prisma.user.findMany({
        where: {
          department: dept,
          role: { in: roles },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          role: true,
          _count: {
            select: {
              assignedTasks: { where: { status: { in: loadStatuses } } },
            },
          },
        },
        orderBy: { assignedTasks: { _count: "asc" } },
      });

      if (candidates.length === 0) continue;

      const best = candidates[0];

      await prisma.task.update({
        where: { id: task.id },
        data: { assignedToId: best.id },
      });

      // Record the (re)assignment in history (status unchanged).
      await prisma.taskStatusHistory.create({
        data: {
          taskId: task.id,
          fromStatus: task.status,
          toStatus: task.status,
          changedById: session.user.id,
        },
      });

      const label = isReview ? "for review" : "to work on";
      await createNotification({
        userId: best.id,
        title: "Task Auto-Assigned",
        message: `'${task.title}' was auto-assigned to you ${label}.`,
        type: "TASK",
        link: "/dashboard/workspace/tasks",
      });

      // Let the department manager know.
      const deptManager = await prisma.user.findFirst({
        where: { department: dept, role: "MANAGER", isActive: true },
        select: { id: true },
      });
      if (deptManager) {
        await createNotification({
          userId: deptManager.id,
          title: "Task Auto-Assigned",
          message: `'${task.title}' auto-assigned to ${best.name} ${label}.`,
          type: "SYSTEM",
          link: "/dashboard/workspace/tasks",
        });
      }

      assigned.push({
        taskId: task.id,
        taskTitle: task.title,
        assignedTo: best.name,
      });

      console.log(
        `[AUTO-ASSIGN] "${task.title}" (${task.status}) -> ${best.name} (${best.role}, ${dept})`
      );
    }

    return Response.json({ assigned: assigned.length, details: assigned });
  } catch (error) {
    console.error("[AUTO-ASSIGN] Error:", error);
    return Response.json(
      { error: "Failed to auto-assign tasks" },
      { status: 500 }
    );
  }
}
