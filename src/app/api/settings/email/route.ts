import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyImapConnection } from "@/lib/email-poller";

/**
 * GET  /api/settings/email  -> current user's email-connection status
 * POST /api/settings/email  -> connect a mailbox { email, appPassword }
 * DELETE /api/settings/email -> disconnect
 *
 * Stores the user's own Gmail IMAP credentials so the Emails tab can show
 * their personal inbox. (Demo: the app password is stored as-is.)
 */

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailConnected: true, imapEmail: true },
  });

  return Response.json({
    connected: !!user?.emailConnected,
    email: user?.imapEmail || null,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { email?: string; appPassword?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = (body.email || "").trim();
  // Gmail app passwords are shown with spaces; strip them.
  const appPassword = (body.appPassword || "").replace(/\s+/g, "");

  if (!email || !appPassword) {
    return Response.json(
      { error: "Email and app password are required." },
      { status: 400 }
    );
  }

  // Verify the credentials actually connect before saving.
  const ok = await verifyImapConnection({ user: email, password: appPassword });
  if (!ok) {
    return Response.json(
      {
        error:
          "Could not connect. Check the email and make sure you used a Gmail App Password (not your normal password), with IMAP enabled.",
      },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      imapEmail: email,
      imapPassword: appPassword,
      emailConnected: true,
    },
  });

  return Response.json({ connected: true, email });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { imapEmail: null, imapPassword: null, emailConnected: false },
  });

  return Response.json({ connected: false });
}
