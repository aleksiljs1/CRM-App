import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { createNotification } from "@/lib/notify";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!task) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll("attachments") as File[];

    if (files.length === 0) {
      return Response.json({ error: "No files provided" }, { status: 400 });
    }

    // Validate and save files
    const saved = [];
    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.has(file.type)) continue; // skip invalid types silently

      const ext = path.extname(file.name);
      const uniqueName = `${crypto.randomUUID()}${ext}`;
      const fullPath = path.join(process.cwd(), "public", "documents", uniqueName);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(fullPath, buffer);

      const attachment = await prisma.taskAttachment.create({
        data: {
          taskId: id,
          fileName: file.name,
          filePath: `/documents/${uniqueName}`,
          fileSize: buffer.length,
          mimeType: file.type,
        },
      });
      saved.push(attachment);
    }

    // Notify everyone involved with the task
    const userIdsToNotify = new Set<string>();
    if (task.assignedTo && task.assignedTo.id !== session.user.id) {
      userIdsToNotify.add(task.assignedTo.id);
    }
    if (task.createdBy.id !== session.user.id) {
      userIdsToNotify.add(task.createdBy.id);
    }

    // Notify department manager
    if (task.department) {
      const manager = await prisma.user.findFirst({
        where: { department: task.department as any, role: "MANAGER", isActive: true },
        select: { id: true },
      });
      if (manager && manager.id !== session.user.id) {
        userIdsToNotify.add(manager.id);
      }
    }

    const fileNames = saved.map(f => f.fileName).join(", ");
    for (const userId of userIdsToNotify) {
      await createNotification({
        userId,
        title: "Documents Added to Task",
        message: `${session.user.name} attached ${saved.length} document(s) to "${task.title}": ${fileNames}`,
        type: "DOCUMENT",
        link: "/dashboard/workspace/tasks",
      });
    }

    return Response.json({ attachments: saved });
  } catch (error) {
    console.error("Error uploading task attachments:", error);
    return Response.json({ error: "Failed to upload" }, { status: 500 });
  }
}
