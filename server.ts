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
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: { origin: "*" },
  });

  // Store io globally so API routes can access it
  (globalThis as any).io = io;

  io.on("connection", (socket) => {
    console.log("[Socket.io] Connected:", socket.id);

    socket.on("join", (userId: string) => {
      socket.join(`user:${userId}`);
    });

    socket.on("join-conversation", (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
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
