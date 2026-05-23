import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "node:fs/promises";
import path from "node:path";

async function findAttachment(id: string) {
  // Try TaskAttachment
  const task = await prisma.taskAttachment.findUnique({
    where: { id },
    include: { task: { select: { id: true, title: true, assignedToId: true, createdById: true } } },
  });
  if (task) return { type: "task" as const, attachment: task, task: task.task };

  // Try EmailAttachment
  const email = await prisma.emailAttachment.findUnique({
    where: { id },
    include: { email: { select: { id: true, subject: true, userId: true } } },
  });
  if (email) return { type: "email" as const, attachment: email, email: email.email };

  // Try MessageAttachment
  const msg = await prisma.messageAttachment.findUnique({
    where: { id },
    include: {
      message: {
        select: {
          id: true,
          senderId: true,
          conversationId: true,
          sender: { select: { name: true } },
        },
      },
    },
  });
  if (msg) return { type: "chat" as const, attachment: msg, message: msg.message };

  // Try ManualDocument
  const manual = await prisma.manualDocument.findUnique({
    where: { id },
    include: { uploadedBy: { select: { name: true } } },
  });
  if (manual) return { type: "manual" as const, attachment: manual };

  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await findAttachment(id);

    if (!result) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    return Response.json({
      id: result.attachment.id,
      fileName: result.attachment.fileName,
      filePath: result.attachment.filePath,
      fileSize: result.attachment.fileSize,
      mimeType: result.attachment.mimeType,
      source: result.type,
    });
  } catch (error: any) {
    console.error("Error fetching document:", error?.message || error);
    return Response.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;
    const role = session.user.role;
    const result = await findAttachment(id);

    if (!result) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    // Access check for task attachments
    if (result.type === "task") {
      const task = result.task!;
      const isPrivileged = ["ADMIN", "PARTNER", "MANAGER"].includes(role);
      const isOwner = task.assignedToId === userId || task.createdById === userId;
      if (!isPrivileged && !isOwner) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Delete physical file
    try {
      const filePath = path.join(process.cwd(), "public", result.attachment.filePath);
      await unlink(filePath);
    } catch {
      // File might not exist on disk, continue with DB deletion
    }

    // Delete DB record
    switch (result.type) {
      case "task":
        await prisma.taskAttachment.delete({ where: { id } });
        break;
      case "email":
        await prisma.emailAttachment.delete({ where: { id } });
        break;
      case "chat":
        await prisma.messageAttachment.delete({ where: { id } });
        break;
      case "manual":
        await prisma.manualDocument.delete({ where: { id } });
        break;
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting document:", error?.message || error);
    return Response.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
