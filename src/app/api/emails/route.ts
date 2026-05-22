import { type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const department = session.user.department || "HR";
    const searchParams = request.nextUrl.searchParams;

    // Filter: all | unread | read | replied
    const filter = searchParams.get("filter") || "all";
    // Search
    const search = searchParams.get("search") || "";
    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: any = {
      recipientDept: department,
    };

    if (filter === "unread") {
      where.isIncoming = true;
      where.isRead = false;
    } else if (filter === "read") {
      where.isRead = true;
    } else if (filter === "unreplied") {
      where.isIncoming = true;
      where.isReplied = false;
    } else if (filter === "replied") {
      where.isReplied = true;
    }
    // "all" = no extra filter

    if (search.trim()) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { senderName: { contains: search, mode: "insensitive" } },
        { senderEmail: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
      ];
    }

    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { client: true },
        skip,
        take: limit,
      }),
      prisma.email.count({ where }),
    ]);

    return Response.json({
      emails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching emails:", error);
    return Response.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}
