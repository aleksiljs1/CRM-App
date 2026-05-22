import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return io;
}

export function initSocketServer(httpServer: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("[Socket.io] Client connected:", socket.id);

    // User joins their personal room (userId)
    socket.on("join", (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`[Socket.io] User ${userId} joined their room`);
    });

    // Join a conversation room
    socket.on("join-conversation", (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
    });

    // Leave a conversation room
    socket.on("leave-conversation", (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });

    // Send message event
    socket.on(
      "send-message",
      (data: {
        conversationId: string;
        senderId: string;
        senderName: string;
        body: string;
        messageId: string;
        createdAt: string;
        attachments?: unknown[];
        recipientIds?: string[];
      }) => {
        // Broadcast to all participants in the conversation room
        socket.to(`conv:${data.conversationId}`).emit("new-message", data);

        // Also emit to individual user rooms for popup notifications
        if (data.recipientIds) {
          data.recipientIds.forEach((uid: string) => {
            io!.to(`user:${uid}`).emit("chat-notification", {
              conversationId: data.conversationId,
              senderName: data.senderName,
              body: data.body,
              messageId: data.messageId,
            });
          });
        }
      }
    );

    // Typing indicator
    socket.on(
      "typing",
      (data: {
        conversationId: string;
        userId: string;
        userName: string;
      }) => {
        socket.to(`conv:${data.conversationId}`).emit("user-typing", data);
      }
    );

    socket.on(
      "stop-typing",
      (data: { conversationId: string; userId: string }) => {
        socket
          .to(`conv:${data.conversationId}`)
          .emit("user-stop-typing", data);
      }
    );

    socket.on("disconnect", () => {
      console.log("[Socket.io] Client disconnected:", socket.id);
    });
  });

  console.log("[Socket.io] Server initialized");
  return io;
}
