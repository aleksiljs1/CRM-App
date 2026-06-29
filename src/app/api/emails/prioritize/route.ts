import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askGemini } from "@/lib/gemini";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["ADMIN", "PARTNER", "MANAGER"];
    if (!allowedRoles.includes(session.user.role)) {
      return Response.json(
        { error: "Forbidden: only ADMIN, PARTNER, or MANAGER can prioritize emails" },
        { status: 403 }
      );
    }

    const department = session.user.department;
    const role = session.user.role;
    const isAdmin = role === "ADMIN" || role === "PARTNER";

    const emailWhere: any = {
      isIncoming: true,
      isReplied: false,
      isRead: false,
    };

    if (!isAdmin && department) {
      emailWhere.recipientDept = department;
    } else if (!isAdmin) {
      emailWhere.recipientDept = "HR";
    }

    const emails = await prisma.email.findMany({
      where: emailWhere,
      include: { client: true },
    });

    if (emails.length === 0) {
      return Response.json({ orderedIds: [], prioritized: [] });
    }

    const deptLabel = department || "all departments";
    const prompt = `You are an email priority assistant for the ${deptLabel} department at Kreston Albania, a professional services firm.

You are given ${emails.length} unread emails. Your job is to ORDER them from MOST URGENT to LEAST URGENT.

Consider:
- Registered clients: emails from one of the firm's REGISTERED CLIENTS should be prioritised ABOVE non-client emails when urgency is otherwise similar. These are paying clients and must not wait.
- Keywords: urgent, deadline, error, asap, overdue, correction, legal, compliance, tax deadline
- Time elapsed since received (older = more urgent, they've been waiting longer)
- Business impact (payroll errors > general questions)

Emails:
${emails.map((e) => `ID: ${e.id} | From: ${e.senderName}${e.client ? ` | REGISTERED CLIENT: ${e.client.companyName}` : " | (not a registered client)"} | Subject: ${e.subject} | Received: ${e.createdAt} | Body: ${e.body.slice(0, 200)}`).join("\n")}

Return ONLY a JSON array of email IDs in order from most urgent to least urgent. Nothing else:
["id1", "id2", "id3"]`;

    const aiResponse = await askGemini(prompt);

    // Extract JSON from AI response
    let jsonStr = aiResponse;
    const codeBlockMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    const orderedIds: string[] = JSON.parse(jsonStr);

    // Update aiImportance based on position (first = 100, last = 1)
    const total = orderedIds.length;
    await Promise.all(
      orderedIds.map((emailId, index) =>
        prisma.email.update({
          where: { id: emailId },
          data: { aiImportance: Math.round(100 - (index / Math.max(total - 1, 1)) * 99) },
        })
      )
    );

    return Response.json({ orderedIds });
  } catch (error) {
    console.error("Error prioritizing emails:", error);
    return Response.json(
      { error: "Failed to prioritize emails" },
      { status: 500 }
    );
  }
}
