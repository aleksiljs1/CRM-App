import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["ADMIN", "PARTNER", "MANAGER"];
    if (!allowedRoles.includes(session.user.role)) {
      return Response.json(
        { error: "Forbidden: only ADMIN, PARTNER, or MANAGER can view report history" },
        { status: 403 }
      );
    }

    const { role, department } = session.user;
    const isAdminOrPartner = role === "ADMIN" || role === "PARTNER";

    const where: Record<string, unknown> = {};
    if (!isAdminOrPartner && department) {
      where.department = department;
    }

    const reports = await prisma.performanceReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        generatedBy: {
          select: { name: true },
        },
      },
    });

    return Response.json({ reports });
  } catch (error) {
    console.error("Error fetching report history:", error);
    return Response.json(
      { error: "Failed to fetch report history" },
      { status: 500 }
    );
  }
}
