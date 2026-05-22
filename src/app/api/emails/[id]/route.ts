import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const email = await prisma.email.findUnique({
      where: { id },
    });

    if (!email) {
      return Response.json({ error: "Email not found" }, { status: 404 });
    }

    const thread = await prisma.email.findMany({
      where: { threadId: email.threadId },
      orderBy: { createdAt: "asc" },
      include: { user: true, attachments: true },
    });

    return Response.json(thread);
  } catch (error) {
    console.error("Error fetching email thread:", error);
    return Response.json(
      { error: "Failed to fetch email thread" },
      { status: 500 }
    );
  }
}
