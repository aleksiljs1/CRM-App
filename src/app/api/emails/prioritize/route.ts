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

    const department = session.user.department;
    const role = session.user.role;
    const isAdmin = role === "ADMIN" || role === "PARTNER";

    const emailWhere: any = {
      isIncoming: true,
      isReplied: false,
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
      return Response.json([]);
    }

    const deptLabel = department || "all departments";
    const prompt = `You are an email priority assistant for the ${deptLabel} department at a professional services firm.
Rank these unread emails by urgency from 1 (least urgent) to 100 (most urgent).

Consider:
- Keywords indicating urgency (urgent, deadline, error, asap, overdue, correction, legal)
- Time elapsed since received (older unresponded emails are more urgent)
- Business impact

Emails:
${emails.map((e) => `ID: ${e.id} | From: ${e.senderName} | Subject: ${e.subject} | Body: ${e.body} | Received: ${e.createdAt}`).join("\n")}

Return ONLY a JSON array, no other text:
[{"emailId": "...", "importance": 85, "reason": "Contains urgent payroll correction request"}]`;

    const aiResponse = await askGemini(prompt);

    // Extract JSON from AI response (handle markdown code blocks)
    let jsonStr = aiResponse;
    const codeBlockMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    const prioritized: Array<{
      emailId: string;
      importance: number;
      reason: string;
    }> = JSON.parse(jsonStr);

    // Update each email's aiImportance in the DB
    await Promise.all(
      prioritized.map((item) =>
        prisma.email.update({
          where: { id: item.emailId },
          data: { aiImportance: item.importance },
        })
      )
    );

    return Response.json(prioritized);
  } catch (error) {
    console.error("Error prioritizing emails:", error);
    return Response.json(
      { error: "Failed to prioritize emails" },
      { status: 500 }
    );
  }
}
