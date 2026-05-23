import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = request.nextUrl;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = 25;
    const skip = (page - 1) * limit;

    const entity = url.searchParams.get("entity") || undefined;
    const userId = url.searchParams.get("userId") || undefined;
    const search = url.searchParams.get("search") || undefined;
    const dateFrom = url.searchParams.get("dateFrom") || undefined;
    const dateTo = url.searchParams.get("dateTo") || undefined;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (entity) {
      where.entity = entity;
    }

    if (userId) {
      where.userId = userId;
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, unknown>).lte = end;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: where as any,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where: where as any }),
    ]);

    // Get distinct users for filter dropdown
    const users = await prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return Response.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return Response.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
