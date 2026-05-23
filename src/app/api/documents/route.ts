import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface UnifiedDocument {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  source: "task" | "email" | "chat";
  sourceLabel: string;
  sourceLink: string;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const department = session.user.department;

    const { searchParams } = new URL(request.url);
    const sourceFilter = searchParams.get("source");
    const searchQuery = searchParams.get("search");
    const typeFilter = searchParams.get("type");

    // 1. Task attachments
    const taskAttachments =
      sourceFilter && sourceFilter !== "task"
        ? []
        : await prisma.taskAttachment.findMany({
            where: {
              task: {
                OR: [{ assignedToId: userId }, { createdById: userId }],
              },
            },
            include: {
              task: { select: { id: true, title: true, status: true } },
            },
            orderBy: { createdAt: "desc" },
          });

    // 2. Email attachments
    const emailAttachments =
      sourceFilter && sourceFilter !== "email"
        ? []
        : await prisma.emailAttachment.findMany({
            where: {
              email: {
                OR: [
                  { userId: userId },
                  ...(department ? [{ recipientDept: department as never }] : []),
                ],
              },
            },
            include: {
              email: {
                select: {
                  id: true,
                  subject: true,
                  senderName: true,
                  isIncoming: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          });

    // 3. Message attachments
    const messageAttachments =
      sourceFilter && sourceFilter !== "chat"
        ? []
        : await prisma.messageAttachment.findMany({
            where: {
              message: {
                conversation: {
                  participants: { some: { userId: userId } },
                },
              },
            },
            include: {
              message: {
                select: {
                  id: true,
                  senderId: true,
                  createdAt: true,
                  sender: { select: { name: true } },
                  conversationId: true,
                },
              },
            },
            orderBy: { messageId: "desc" },
          });

    // Normalize into unified format
    const taskDocs: UnifiedDocument[] = taskAttachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      filePath: a.filePath,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
      createdAt: a.createdAt.toISOString(),
      source: "task" as const,
      sourceLabel: `Task: ${a.task.title}`,
      sourceLink: "/dashboard/hr/tasks",
    }));

    const emailDocs: UnifiedDocument[] = emailAttachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      filePath: a.filePath,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
      createdAt: a.createdAt.toISOString(),
      source: "email" as const,
      sourceLabel: a.email.isIncoming
        ? `Email from ${a.email.senderName || "Unknown"}: ${a.email.subject}`
        : `Email: ${a.email.subject}`,
      sourceLink: "/dashboard/hr/emails",
    }));

    const chatDocs: UnifiedDocument[] = messageAttachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      filePath: a.filePath,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
      createdAt: a.message.createdAt.toISOString(),
      source: "chat" as const,
      sourceLabel: `Chat with ${a.message.sender.name}`,
      sourceLink: "/dashboard/hr/chats",
    }));

    let allDocs = [...taskDocs, ...emailDocs, ...chatDocs];

    // Apply search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      allDocs = allDocs.filter((d) => d.fileName.toLowerCase().includes(q));
    }

    // Apply type filter
    if (typeFilter) {
      allDocs = allDocs.filter((d) => {
        const mime = d.mimeType.toLowerCase();
        const name = d.fileName.toLowerCase();
        switch (typeFilter) {
          case "pdf":
            return mime.includes("pdf");
          case "word":
            return (
              mime.includes("word") ||
              mime.includes("msword") ||
              name.endsWith(".doc") ||
              name.endsWith(".docx")
            );
          case "excel":
            return (
              mime.includes("spreadsheet") ||
              mime.includes("excel") ||
              name.endsWith(".xls") ||
              name.endsWith(".xlsx") ||
              name.endsWith(".csv")
            );
          case "image":
            return mime.startsWith("image/");
          case "other":
            return (
              !mime.includes("pdf") &&
              !mime.includes("word") &&
              !mime.includes("msword") &&
              !mime.includes("spreadsheet") &&
              !mime.includes("excel") &&
              !mime.startsWith("image/") &&
              !name.endsWith(".doc") &&
              !name.endsWith(".docx") &&
              !name.endsWith(".xls") &&
              !name.endsWith(".xlsx")
            );
          default:
            return true;
        }
      });
    }

    // Sort by createdAt desc
    allDocs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const counts = {
      total: allDocs.length,
      task: allDocs.filter((d) => d.source === "task").length,
      email: allDocs.filter((d) => d.source === "email").length,
      chat: allDocs.filter((d) => d.source === "chat").length,
    };

    return Response.json({ documents: allDocs, counts });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return Response.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
