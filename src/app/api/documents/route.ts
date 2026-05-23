import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

interface UnifiedDocument {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  source: "task" | "email" | "chat" | "manual";
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

    // 4. Manual uploads
    const manualAttachments =
      sourceFilter && sourceFilter !== "manual"
        ? []
        : await prisma.manualDocument.findMany({
            where: department
              ? {
                  OR: [
                    { uploadedById: userId },
                    { department: department as any },
                  ],
                }
              : { uploadedById: userId },
            include: {
              uploadedBy: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
          });

    const manualDocs: UnifiedDocument[] = manualAttachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      filePath: a.filePath,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
      createdAt: a.createdAt.toISOString(),
      source: "manual" as const,
      sourceLabel: `Uploaded by ${a.uploadedBy.name}`,
      sourceLink: "/dashboard/hr/documents",
    }));

    let allDocs = [...taskDocs, ...emailDocs, ...chatDocs, ...manualDocs];

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
      manual: allDocs.filter((d) => d.source === "manual").length,
    };

    return Response.json({ documents: allDocs, counts });
  } catch (error: any) {
    console.error("Error fetching documents:", error?.message || error);
    return Response.json(
      { error: "Failed to fetch documents", detail: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return Response.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
    await mkdir(uploadDir, { recursive: true });

    const created = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const filePath = path.join(uploadDir, uniqueName);
      await writeFile(filePath, buffer);

      const doc = await prisma.manualDocument.create({
        data: {
          fileName: file.name,
          filePath: `uploads/documents/${uniqueName}`,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          department: session.user.department || null,
          uploadedById: session.user.id,
        },
      });
      created.push(doc);
    }

    return Response.json({ documents: created, count: created.length });
  } catch (error) {
    console.error("Error uploading documents:", error);
    return Response.json(
      { error: "Failed to upload documents" },
      { status: 500 }
    );
  }
}
