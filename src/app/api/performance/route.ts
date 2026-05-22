import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface PerformanceData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string | null;
  };
  performanceScore: number;
  tasksCompleted: number;
  totalTasks: number;
  onTimeRate: number;
  highPriorityCompleted: number;
  avgTasksPerMonth: number;
  emailsHandled: number;
  clientsManaged: number;
}

export async function getPerformanceData(): Promise<PerformanceData[]> {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { not: "CLIENT" },
    },
    select: { id: true, name: true, email: true, role: true, department: true },
  });

  const results: PerformanceData[] = [];

  for (const user of users) {
    // All tasks assigned to this user
    const allTasks = await prisma.task.findMany({
      where: { assignedToId: user.id },
      select: {
        status: true,
        priority: true,
        deadline: true,
        completedAt: true,
        createdAt: true,
      },
    });

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === "COMPLETED");
    const tasksCompleted = completedTasks.length;

    // On-time rate
    let onTimeCount = 0;
    for (const task of completedTasks) {
      if (!task.deadline) {
        onTimeCount++; // no deadline = on time
      } else if (task.completedAt && task.completedAt <= task.deadline) {
        onTimeCount++;
      }
    }
    const onTimeRate = tasksCompleted > 0 ? Math.round((onTimeCount / tasksCompleted) * 100) : 100;

    // High priority completed
    const highPriorityCompleted = completedTasks.filter(
      (t) => t.priority === "HIGH" || t.priority === "URGENT"
    ).length;

    // Avg tasks per month
    let monthsActive = 1;
    if (allTasks.length > 0) {
      const firstTaskDate = allTasks.reduce(
        (min, t) => (t.createdAt < min ? t.createdAt : min),
        allTasks[0].createdAt
      );
      const monthsDiff =
        (Date.now() - firstTaskDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      monthsActive = Math.max(1, Math.floor(monthsDiff));
    }
    const avgTasksPerMonth = Math.round((tasksCompleted / monthsActive) * 10) / 10;

    // Emails handled (outgoing)
    const emailsHandled = await prisma.email.count({
      where: { userId: user.id, isIncoming: false },
    });

    // Clients managed
    const clientsManaged = await prisma.client.count({
      where: { assignedToId: user.id, status: "ACTIVE" },
    });

    // Calculate performance score
    const completionRate = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;
    const highPriorityRatio =
      tasksCompleted > 0 ? (highPriorityCompleted / tasksCompleted) * 100 : 0;

    const performanceScore = Math.round(
      completionRate * 0.3 +
        onTimeRate * 0.25 +
        highPriorityRatio * 0.2 +
        Math.min(avgTasksPerMonth * 5, 100) * 0.15 +
        Math.min(emailsHandled * 2, 100) * 0.1
    );

    results.push({
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
      onTimeRate,
      highPriorityCompleted,
      avgTasksPerMonth,
      emailsHandled,
      clientsManaged,
    });
  }

  // Sort by performance score descending
  results.sort((a, b) => b.performanceScore - a.performanceScore);
  return results;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getPerformanceData();
    return Response.json(data);
  } catch (error) {
    console.error("Error calculating performance:", error);
    return Response.json(
      { error: "Failed to calculate performance data" },
      { status: 500 }
    );
  }
}
