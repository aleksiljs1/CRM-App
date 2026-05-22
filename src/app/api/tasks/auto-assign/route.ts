import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/tasks/auto-assign
 *
 * Auto-assigns unassigned REVIEW tasks to the Senior/Associate with the
 * fewest review tasks in that department.
 *
 * Runs on:
 * - Manual trigger (manager clicks button)
 * - Called from the email poller interval (every 10s, checks if any tasks
 *   have been unassigned for > AUTO_ASSIGN_HOURS)
 *
 * Default: tasks unassigned for 24+ hours get auto-assigned.
 */

const DEFAULT_AUTO_ASSIGN_HOURS = 24;

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get per-department settings
    const allSettings = await prisma.departmentSettings.findMany();
    const settingsMap = new Map(
      allSettings.map((s) => [s.department, s.autoAssignReviewHours])
    );

    // Find all REVIEW tasks that are unassigned
    const unassignedReviews = await prisma.task.findMany({
      where: {
        status: "REVIEW",
        assignedToId: null,
      },
      include: {
        statusHistory: {
          where: { toStatus: "REVIEW" },
          orderBy: { changedAt: "desc" },
          take: 1,
        },
      },
    });

    // Filter to tasks that exceeded their department's auto-assign threshold
    const overdueReviews = unassignedReviews.filter((task) => {
      const reviewEntry = task.statusHistory[0];
      if (!reviewEntry) return false;
      const hours = settingsMap.get(task.department as any) ?? DEFAULT_AUTO_ASSIGN_HOURS;
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      return new Date(reviewEntry.changedAt) < cutoff;
    });

    if (overdueReviews.length === 0) {
      return Response.json({ assigned: 0, message: "No overdue review tasks" });
    }

    const assigned: { taskId: string; taskTitle: string; assignedTo: string }[] = [];

    for (const task of overdueReviews) {
      // Find eligible reviewers in the same department
      const dept = task.department;
      if (!dept) continue;

      const eligibleReviewers = await prisma.user.findMany({
        where: {
          department: dept,
          role: { in: ["SENIOR", "ASSOCIATE"] },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          role: true,
          _count: {
            select: {
              assignedTasks: {
                where: { status: "REVIEW" },
              },
            },
          },
        },
        orderBy: {
          assignedTasks: { _count: "asc" },
        },
      });

      if (eligibleReviewers.length === 0) continue;

      // Pick the one with fewest review tasks
      const bestReviewer = eligibleReviewers[0];

      // Assign the task
      await prisma.task.update({
        where: { id: task.id },
        data: { assignedToId: bestReviewer.id },
      });

      // Log it in status history
      await prisma.taskStatusHistory.create({
        data: {
          taskId: task.id,
          fromStatus: "REVIEW",
          toStatus: "REVIEW",
          changedById: session.user.id,
        },
      });

      // Create notification for the reviewer
      await prisma.notification.create({
        data: {
          userId: bestReviewer.id,
          title: "Review Auto-Assigned",
          message: `Task "${task.title}" has been auto-assigned to you for review.`,
          type: "TASK",
          link: "/dashboard/hr/tasks",
        },
      });

      assigned.push({
        taskId: task.id,
        taskTitle: task.title,
        assignedTo: bestReviewer.name,
      });

      console.log(
        `[AUTO-ASSIGN] "${task.title}" -> ${bestReviewer.name} (${bestReviewer.role}, ${dept})`
      );
    }

    return Response.json({
      assigned: assigned.length,
      details: assigned,
    });
  } catch (error) {
    console.error("[AUTO-ASSIGN] Error:", error);
    return Response.json(
      { error: "Failed to auto-assign tasks" },
      { status: 500 }
    );
  }
}
