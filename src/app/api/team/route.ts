import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { Role, Department } from "@/generated/prisma/enums";

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
        subRole: true,
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

const CREATABLE_ROLES = ["SENIOR", "ASSOCIATE", "JUNIOR", "ASSISTANT", "INTERN"];

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, department } = session.user;

    // Only ADMIN, PARTNER, MANAGER can create employees
    if (!["ADMIN", "PARTNER", "MANAGER"].includes(role)) {
      return Response.json(
        { error: "Forbidden: only ADMIN, PARTNER, or MANAGER can create employees" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role: newRole, subRole, department: reqDepartment } = body;

    // Validate required fields
    if (!name || !email || !password || !newRole) {
      return Response.json(
        { error: "Name, email, password, and role are required" },
        { status: 400 }
      );
    }

    // Cannot create MANAGER, PARTNER, ADMIN, or CLIENT
    if (!CREATABLE_ROLES.includes(newRole)) {
      return Response.json(
        { error: `Cannot create employees with role: ${newRole}. Allowed: ${CREATABLE_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: "An employee with this email already exists" }, { status: 409 });
    }

    // For MANAGER: force department to their own
    let finalDepartment: string | null;
    if (role === "MANAGER") {
      finalDepartment = department;
    } else {
      finalDepartment = reqDepartment || department || null;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: newRole as Role,
        subRole: subRole || null,
        department: finalDepartment as Department | null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subRole: true,
        department: true,
        avatar: true,
        createdAt: true,
      },
    });

    return Response.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Error creating employee:", error);
    return Response.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
