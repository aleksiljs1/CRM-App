import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const email = await prisma.email.findUnique({
      where: { id },
    });

    if (!email) {
      return Response.json({ error: "Email not found" }, { status: 404 });
    }

    // Permission check: ADMIN/PARTNER can view all, others must match department
    const userRole = session.user.role;
    const userDept = session.user.department;
    const isAdminOrPartner = userRole === "ADMIN" || userRole === "PARTNER";

    if (!isAdminOrPartner && email.recipientDept !== userDept) {
      return Response.json(
        { error: "You do not have permission to view this email" },
        { status: 403 }
      );
    }

    // Mark all incoming unread emails in this thread as read
    await prisma.email.updateMany({
      where: {
        threadId: email.threadId,
        isIncoming: true,
        isRead: false,
      },
      data: { isRead: true },
    });

    const thread = await prisma.email.findMany({
      where: { threadId: email.threadId },
      orderBy: { createdAt: "asc" },
      include: { user: true, attachments: true },
    });

    return Response.json(thread);
  } catch (error) {
    console.error("Error fetching email thread:", error);
    return Response.json(
      { error: "Failed to fetch email thread" },
      { status: 500 }
    );
  }
}
