import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000");

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(server, {
    path: "/socket.io",
    addTrailingSlash: false,
    cors: { origin: "*" },
  });

  // Store io globally so API routes can access it
  (globalThis as any).io = io;

  io.on("connection", (socket) => {
    console.log("[Socket.io] Connected:", socket.id);

    socket.on("join", (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`[Socket.io] User ${userId} joined room user:${userId}`);
    });

    // Subscribe to task-list broadcasts. Each task page (HR + admin) calls this
    // on mount so the user receives task-updated / task-created / task-deleted
    // events for tasks in their scope. dept = their own department; firm:tasks
    // is the cross-dept room for ADMIN + PARTNER.
    socket.on(
      "subscribe-tasks",
      (data: { department?: string | null; role?: string }) => {
        if (data?.department) {
          socket.join(`dept:${data.department}`);
        }
        if (data?.role === "ADMIN" || data?.role === "PARTNER") {
          socket.join("firm:tasks");
        }
      }
    );

    socket.on("join-conversation", (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
      console.log(`[Socket.io] Joined conversation room conv:${conversationId}`);
    });

    socket.on("leave-conversation", (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on("send-message", (data) => {
      // Broadcast to conversation room
      socket.to(`conv:${data.conversationId}`).emit("new-message", data);
      // Also notify individual user rooms for popup
      if (data.recipientIds) {
        data.recipientIds.forEach((uid: string) => {
          io.to(`user:${uid}`).emit("chat-notification", {
            conversationId: data.conversationId,
            senderName: data.senderName,
            body: data.body,
            messageId: data.messageId,
          });
        });
      }
    });

    socket.on("typing", (data) => {
      socket.to(`conv:${data.conversationId}`).emit("user-typing", data);
    });

    socket.on("stop-typing", (data) => {
      socket.to(`conv:${data.conversationId}`).emit("user-stop-typing", data);
    });

    socket.on("disconnect", () => {
      console.log("[Socket.io] Disconnected:", socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io initialized on /api/socketio`);
  });
});
