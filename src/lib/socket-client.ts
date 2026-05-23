"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: "/api/socketio",
      addTrailingSlash: false,
    });

    socket.on("connect", () => {
      console.log("[Socket.io Client] Connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket.io Client] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket.io Client] Connection error:", err.message);
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
