import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const unreadOnly = searchParams.get("unread") === "true";

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.notification.count({
        where: { userId: session.user.id, isRead: false },
      }),
    ]);

    return Response.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return Response.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids, all } = body as { ids?: string[]; all?: boolean };

    let updated: number;

    if (all) {
      const result = await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      });
      updated = result.count;
    } else if (ids && ids.length > 0) {
      const result = await prisma.notification.updateMany({
        where: {
          id: { in: ids },
          userId: session.user.id,
        },
        data: { isRead: true },
      });
      updated = result.count;
    } else {
      return Response.json(
        { error: "Provide ids or all: true" },
        { status: 400 }
      );
    }

    return Response.json({ updated });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return Response.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
