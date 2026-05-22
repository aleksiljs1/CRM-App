import { type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

// GET - Fetch messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: session.user.id,
        },
      },
    });

    if (!participant) {
      return Response.json({ error: "Not a participant" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const before = searchParams.get("before");

    const where: Record<string, unknown> = { conversationId: id };
    if (before) {
      where.createdAt = { lt: new Date(before) };
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: 50,
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
        attachments: true,
      },
    });

    // Update lastReadAt
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: session.user.id,
        },
      },
      data: { lastReadAt: new Date() },
    });

    return Response.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return Response.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: session.user.id,
        },
      },
    });

    if (!participant) {
      return Response.json({ error: "Not a participant" }, { status: 403 });
    }

    const formData = await request.formData();
    const bodyText = (formData.get("body") as string) || "";
    const files = formData.getAll("attachments") as File[];

    if (!bodyText.trim() && files.length === 0) {
      return Response.json(
        { error: "Message body or attachments required" },
        { status: 400 }
      );
    }

    // Save attachments
    const attachmentData: {
      fileName: string;
      filePath: string;
      fileSize: number;
      mimeType: string;
    }[] = [];

    if (files.length > 0) {
      const uploadDir = path.join(process.cwd(), "public", "documents");
      await mkdir(uploadDir, { recursive: true });

      for (const file of files) {
        if (file.size === 0) continue;
        const ext = path.extname(file.name);
        const uniqueName = `${crypto.randomUUID()}${ext}`;
        const filePath = path.join(uploadDir, uniqueName);
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);

        attachmentData.push({
          fileName: file.name,
          filePath: `/documents/${uniqueName}`,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
        });
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: session.user.id,
        body: bodyText,
        attachments: {
          create: attachmentData,
        },
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
        attachments: true,
      },
    });

    // Update conversation's updatedAt
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // Update sender's lastReadAt
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: session.user.id,
        },
      },
      data: { lastReadAt: new Date() },
    });

    // Emit via Socket.io if available
    const io = (globalThis as any).io;
    if (io) {
      const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId: id, userId: { not: session.user.id } },
        select: { userId: true },
      });

      const messageData = {
        conversationId: id,
        messageId: message.id,
        senderId: session.user.id,
        senderName: session.user.name,
        body: bodyText,
        createdAt: message.createdAt,
        attachments: message.attachments,
        recipientIds: participants.map((p) => p.userId),
      };

      io.to(`conv:${id}`).emit("new-message", messageData);

      // Send notification to each participant's personal room
      participants.forEach((p) => {
        io.to(`user:${p.userId}`).emit("chat-notification", messageData);
      });
    }

    return Response.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return Response.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
