import { NextResponse } from "next/server";

// Socket.io uses its own upgrade mechanism, not regular HTTP routes.
// This route exists just so the path is registered.
// The actual Socket.io server is initialized via the custom server (server.ts).

export async function GET() {
  return NextResponse.json({ status: "Socket.io endpoint" });
}
