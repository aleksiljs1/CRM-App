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
    const unreadOnly = searchParams.get("unread") === "true";

    const where: Record<string, unknown> = {
      recipientDept: department,
    };

    if (unreadOnly) {
      where.isIncoming = true;
      where.isReplied = false;
    }

    const emails = await prisma.email.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { client: true },
    });

    return Response.json(emails);
  } catch (error) {
    console.error("Error fetching emails:", error);
    return Response.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}
