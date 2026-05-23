import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const { role } = session.user;

    // MANAGER+ can view any employee's tasks; others can only view their own
    const isManagerPlus = ["ADMIN", "PARTNER", "MANAGER"].includes(role);
    if (!isManagerPlus && session.user.id !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse period from query
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "week";

    const now = new Date();
    const rangeStart = new Date();
    if (period === "day") {
      rangeStart.setHours(rangeStart.getHours() - 24);
    } else if (period === "week") {
      rangeStart.setDate(rangeStart.getDate() - 7);
    } else {
      rangeStart.setDate(rangeStart.getDate() - 30);
    }

    // Fetch tasks: completed in range OR currently active
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: userId,
        OR: [
          { completedAt: { gte: rangeStart, lte: now } },
          { status: { not: "COMPLETED" } },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        deadline: true,
        createdAt: true,
        completedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const completed = tasks.filter((t) => t.status === "COMPLETED").length;
    const active = tasks.filter((t) => t.status !== "COMPLETED").length;
    const overdue = tasks.filter(
      (t) =>
        t.status !== "COMPLETED" && t.deadline && new Date(t.deadline) < now
    ).length;

    return Response.json({
      tasks: tasks.map((t) => ({
        ...t,
        hoursToComplete:
          t.completedAt && t.createdAt
            ? Math.round(
                ((new Date(t.completedAt).getTime() -
                  new Date(t.createdAt).getTime()) /
                  (1000 * 60 * 60)) *
                  10
              ) / 10
            : null,
      })),
      summary: { completed, active, overdue },
    });
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    return Response.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
