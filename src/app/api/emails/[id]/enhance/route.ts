import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askGemini } from "@/lib/gemini";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { draft } = await request.json();

    if (!draft || !draft.trim()) {
      return Response.json({ error: "Draft text is required" }, { status: 400 });
    }

    // Get the email and its full thread
    const email = await prisma.email.findUnique({ where: { id } });
    if (!email) {
      return Response.json({ error: "Email not found" }, { status: 404 });
    }

    const thread = await prisma.email.findMany({
      where: { threadId: email.threadId },
      orderBy: { createdAt: "asc" },
      select: {
        senderName: true,
        senderEmail: true,
        subject: true,
        body: true,
        isIncoming: true,
        createdAt: true,
      },
    });

    // Get client history if available
    let clientContext = "";
    if (email.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: email.clientId },
        include: {
          submissions: { include: { processType: true }, take: 5 },
          tasks: { take: 5, orderBy: { createdAt: "desc" } },
        },
      });
      if (client) {
        clientContext = `\n\nClient Context:
- Company: ${client.companyName}
- Contact: ${client.contactName} (${client.contactEmail})
- Status: ${client.status}
- Active processes: ${client.submissions.map((s) => `${s.processType.name} (${s.status})`).join(", ") || "None"}
- Recent tasks: ${client.tasks.map((t) => `${t.title} (${t.status})`).join(", ") || "None"}`;
      }
    }

    // Build the conversation history
    const conversationHistory = thread
      .map(
        (msg) =>
          `[${msg.isIncoming ? "CLIENT" : "KRESTON"}] ${msg.senderName} (${new Date(msg.createdAt).toLocaleDateString()}):\n${msg.body}`
      )
      .join("\n\n---\n\n");

    const prompt = `You are a professional email writer for Kreston Albania, a professional services firm specializing in audit, tax, legal, and advisory services.

Your name is ${session.user.name}. You work in the ${session.user.department || "HR"} department.

Here is the full email conversation so far:

${conversationHistory}
${clientContext}

The employee wants to reply but only wrote a quick lazy draft. Your job is to turn their draft into a professional, warm, and helpful email reply. Keep the same meaning and intent but make it:
- Professional but friendly tone
- Clear and well-structured
- Appropriate for a client-facing professional services firm
- Not too long (keep it concise)
- Don't add fake details or promises the draft doesn't mention
- Don't add a subject line, just the body

Employee's lazy draft:
"${draft}"

Write ONLY the enhanced email body. No subject line, no "Dear..." if the draft doesn't have one (but add an appropriate greeting if it makes sense). No signature block.`;

    const enhanced = await askGemini(prompt);

    return Response.json({ enhanced: enhanced.trim() });
  } catch (error) {
    console.error("Error enhancing email:", error);
    return Response.json(
      { error: "Failed to enhance email" },
      { status: 500 }
    );
  }
}
