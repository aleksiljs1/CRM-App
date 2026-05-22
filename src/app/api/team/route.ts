import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, department } = session.user;

    // All authenticated non-CLIENT users can see their department colleagues
    // ADMIN/PARTNER see all non-CLIENT users; others see own department
    const whereUsers: Record<string, unknown> = {
      role: { not: "CLIENT" },
      isActive: true,
    };

    if (role !== "ADMIN" && role !== "PARTNER" && department) {
      whereUsers.department = department;
    } else if (role !== "ADMIN" && role !== "PARTNER" && !department) {
      whereUsers.department = "HR";
    }

    const users = await prisma.user.findMany({
      where: whereUsers,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        avatar: true,
        createdAt: true,
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

        return {
          user,
          stats: {
            totalTasks,
            completedTasks,
            inProgressTasks,
            overdueTasks,
            completionRate,
            emailsHandled,
          },
        };
      })
    );

    return Response.json({ team });
  } catch (error) {
    console.error("Error fetching team:", error);
    return Response.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}
