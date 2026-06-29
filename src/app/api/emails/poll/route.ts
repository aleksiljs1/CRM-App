import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchNewEmails } from "@/lib/email-poller";

/**
 * POST /api/emails/poll
 * Manually triggers an IMAP poll to fetch new emails from Gmail.
 * Called by the frontend on an interval or button press.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Poll the logged-in user's OWN mailbox (connected via Settings -> Email).
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        imapEmail: true,
        imapPassword: true,
        imapHost: true,
        emailConnected: true,
      },
    });

    if (!me?.emailConnected || !me.imapEmail || !me.imapPassword) {
      return Response.json({ notConnected: true, fetched: 0, emails: [] });
    }

    const newEmails = await fetchNewEmails({
      user: me.imapEmail,
      password: me.imapPassword,
      host: me.imapHost || undefined,
    });

    if (!newEmails || newEmails.length === 0) {
      return Response.json({ fetched: 0, emails: [] });
    }

    // Save each new email to the database, owned by this user.
    const saved = [];
    for (const emailData of newEmails) {
      // Dedup within THIS user's inbox (by sender + subject + body start).
      const existing = await prisma.email.findFirst({
        where: {
          userId: session.user.id,
          senderEmail: emailData.senderEmail,
          subject: emailData.subject,
          body: emailData.body.slice(0, 200),
        },
      });

      if (existing) continue; // skip duplicates

      // Try to match sender to existing client
      const client = await prisma.client.findFirst({
        where: { contactEmail: emailData.senderEmail },
      });

      const email = await prisma.email.create({
        data: {
          threadId: emailData.threadId,
          senderEmail: emailData.senderEmail,
          senderName: emailData.senderName,
          recipientDept: emailData.recipientDept as any,
          subject: emailData.subject,
          body: emailData.body,
          isIncoming: true,
          isRead: false,
          isReplied: false,
          clientId: client?.id || null,
          userId: session.user.id,
          createdAt: emailData.date || undefined,
        },
      });

      saved.push(email);

      // Notify the inbox owner only.
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          title: "New Email",
          message: `From ${emailData.senderName}: ${emailData.subject}`,
          type: "EMAIL" as const,
          link: "/dashboard/workspace/emails",
        },
      });

      console.log(
        `[POLL] Saved email for ${me.imapEmail} from ${emailData.senderEmail}: "${emailData.subject}"`
      );
    }

    return Response.json({ fetched: saved.length, emails: saved });
  } catch (error) {
    console.error("[POLL] Error:", error);
    return Response.json(
      { error: "Failed to poll emails" },
      { status: 500 }
    );
  }
}
