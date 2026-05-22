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
    if (!["ADMIN", "PARTNER", "MANAGER"].includes(role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const dept = department || "HR";

    // Get or create settings for this department
    let settings = await prisma.departmentSettings.findUnique({
      where: { department: dept as any },
      include: { updatedBy: { select: { name: true } } },
    });

    if (!settings) {
      settings = await prisma.departmentSettings.create({
        data: {
          department: dept as any,
          autoAssignReviewHours: 24,
          updatedById: session.user.id,
        },
        include: { updatedBy: { select: { name: true } } },
      });
    }

    return Response.json({ settings });
  } catch (error) {
    console.error("Error fetching department settings:", error);
    return Response.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, department } = session.user;
    if (!["ADMIN", "PARTNER", "MANAGER"].includes(role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const dept = department || "HR";
    const body = await request.json();
    const { autoAssignReviewHours } = body;

    if (typeof autoAssignReviewHours !== "number" || autoAssignReviewHours < 1 || autoAssignReviewHours > 168) {
      return Response.json(
        { error: "Auto-assign hours must be between 1 and 168 (1 week)" },
        { status: 400 }
      );
    }

    const settings = await prisma.departmentSettings.upsert({
      where: { department: dept as any },
      update: {
        autoAssignReviewHours,
        updatedById: session.user.id,
      },
      create: {
        department: dept as any,
        autoAssignReviewHours,
        updatedById: session.user.id,
      },
      include: { updatedBy: { select: { name: true } } },
    });

    return Response.json({ settings });
  } catch (error) {
    console.error("Error updating department settings:", error);
    return Response.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
