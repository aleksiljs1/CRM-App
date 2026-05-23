import { prisma } from "@/lib/prisma";

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: "EMAIL" | "TASK" | "DOCUMENT" | "SYSTEM";
  link?: string;
}) {
  const notification = await prisma.notification.create({
    data: params,
  });

  // Emit via Socket.io if available
  const io = (globalThis as any).io;
  if (io) {
    io.to(`user:${params.userId}`).emit("notification", {
      id: notification.id,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link,
      createdAt: notification.createdAt,
    });
  }

  return notification;
}
