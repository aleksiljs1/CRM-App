import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Webhook endpoint for receiving incoming emails.
 *
 * Accepts multiple formats:
 *
 * 1. SendGrid Inbound Parse (multipart/form-data):
 *    - from, to, subject, text, html, envelope, attachments, etc.
 *
 * 2. Mailgun (multipart/form-data):
 *    - sender, from, subject, body-plain, body-html, etc.
 *
 * 3. Simple JSON (for testing / custom integrations):
 *    - { from, fromName, subject, body, department }
 *
 * POST https://desktop-35mtkeg.tailaf7658.ts.net/api/emails/incoming
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let senderEmail = "";
    let senderName = "";
    let subject = "";
    let body = "";
    let department = "HR";

    if (contentType.includes("multipart/form-data")) {
      // ------- SendGrid / Mailgun Inbound Parse -------
      const formData = await request.formData();

      // SendGrid format
      const from = (formData.get("from") as string) || "";
      const envelope = formData.get("envelope") as string;
      subject = (formData.get("subject") as string) || "(No Subject)";
      body =
        (formData.get("text") as string) ||
        (formData.get("body-plain") as string) ||
        (formData.get("html") as string) ||
        "";

      // Parse sender from "Name <email>" format
      const emailMatch = from.match(/<(.+?)>/);
      if (emailMatch) {
        senderEmail = emailMatch[1];
        senderName = from.replace(/<.+?>/, "").trim().replace(/^"|"$/g, "");
      } else if (envelope) {
        try {
          const env = JSON.parse(envelope);
          senderEmail = env.from || from;
        } catch {
          senderEmail = from;
        }
      } else {
        senderEmail = from;
      }

      if (!senderName) senderName = senderEmail.split("@")[0];

      // Determine department from "to" address
      const to = (formData.get("to") as string) || "";
      if (to.toLowerCase().includes("legal")) department = "LEGAL";
      else if (to.toLowerCase().includes("audit")) department = "AUDIT";
      else if (to.toLowerCase().includes("tax") || to.toLowerCase().includes("accounting"))
        department = "ACCOUNTING_TAX";
      else department = "HR";
    } else {
      // ------- Simple JSON (for testing) -------
      const json = await request.json();
      senderEmail = json.from || json.senderEmail || "unknown@test.com";
      senderName = json.fromName || json.senderName || senderEmail.split("@")[0];
      subject = json.subject || "(No Subject)";
      body = json.body || json.text || "";
      department = (json.department || "HR").toUpperCase();
    }

    // Clean up body - strip excessive whitespace/HTML
    body = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (body.length > 5000) body = body.slice(0, 5000);

    // Generate thread ID
    const threadId = `thread-${crypto.randomUUID().slice(0, 8)}`;

    // Try to match sender to existing client
    const client = await prisma.client.findFirst({
      where: { contactEmail: senderEmail },
    });

    // Save to database
    const email = await prisma.email.create({
      data: {
        threadId,
        senderEmail,
        senderName: senderName || senderEmail.split("@")[0],
        recipientDept: department as
          | "HR"
          | "AUDIT"
          | "ACCOUNTING_TAX"
          | "BOOKKEEPING_PAYROLL"
          | "LEGAL"
          | "ADVISORY"
          | "MARKETING"
          | "FINANCE",
        subject,
        body,
        isIncoming: true,
        isRead: false,
        isReplied: false,
        clientId: client?.id || null,
      },
    });

    // Create notification for the department
    // Find users in that department
    const deptUsers = await prisma.user.findMany({
      where: {
        department: department as any,
        isActive: true,
      },
      select: { id: true },
    });

    if (deptUsers.length > 0) {
      await prisma.notification.createMany({
        data: deptUsers.map((u) => ({
          userId: u.id,
          title: "New Email",
          message: `From ${senderName}: ${subject}`,
          type: "EMAIL" as const,
          link: `/dashboard/hr/emails`,
        })),
      });
    }

    console.log(
      `[WEBHOOK] Received email from ${senderEmail}: "${subject}" -> ${department}`
    );

    return Response.json(
      { success: true, emailId: email.id, threadId: email.threadId },
      { status: 200 }
    );
  } catch (error) {
    console.error("[WEBHOOK] Error processing incoming email:", error);
    return Response.json(
      { error: "Failed to process incoming email" },
      { status: 500 }
    );
  }
}

// SendGrid sends a GET to verify the webhook URL exists
export async function GET() {
  return Response.json({ status: "ok", message: "Email webhook is active" });
}
