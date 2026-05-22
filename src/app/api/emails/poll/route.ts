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

    const newEmails = await fetchNewEmails();

    if (!newEmails || newEmails.length === 0) {
      return Response.json({ fetched: 0, emails: [] });
    }

    // Save each new email to the database
    const saved = [];
    for (const emailData of newEmails) {
      // Check if we already have this email (by sender + subject + close timestamp)
      const existing = await prisma.email.findFirst({
        where: {
          senderEmail: emailData.senderEmail,
          subject: emailData.subject,
          body: emailData.body.slice(0, 200), // rough dedup
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
        },
      });

      saved.push(email);

      // Notify users in the MATCHING department (not just HR)
      const deptUsers = await prisma.user.findMany({
        where: { department: emailData.recipientDept as any, isActive: true },
        select: { id: true },
      });

      if (deptUsers.length > 0) {
        await prisma.notification.createMany({
          data: deptUsers.map((u) => ({
            userId: u.id,
            title: "New Email",
            message: `From ${emailData.senderName}: ${emailData.subject}`,
            type: "EMAIL" as const,
            link: "/dashboard/hr/emails",
          })),
        });
      }

      console.log(
        `[POLL] Saved email from ${emailData.senderEmail}: "${emailData.subject}" -> ${emailData.recipientDept}`
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
