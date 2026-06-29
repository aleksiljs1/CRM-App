import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/submissions
 *
 * STAFF view of client document submissions (the firm side).
 * - ADMIN / PARTNER see every department's submissions.
 * - Other staff see submissions for processes in their own department.
 * - CLIENT role is not allowed here (clients use /api/client/submissions).
 *
 * Returns each submission with its client, process, the required CLIENT
 * documents, and the actual uploaded files (incl. filePath for download and
 * the AI-matched required document).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const department = session.user.department;

    if (role === "CLIENT") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const isFirmWide = role === "ADMIN" || role === "PARTNER";

    const where: any = {};
    if (!isFirmWide) {
      // Scope to submissions whose process belongs to the user's department.
      where.processType = { department: (department || "HR") as any };
    }

    const submissions = await prisma.clientSubmission.findMany({
      where,
      include: {
        client: {
          select: { id: true, companyName: true, contactName: true, contactEmail: true },
        },
        processType: {
          include: {
            requiredDocuments: { where: { source: "CLIENT" } },
          },
        },
        documents: {
          include: { aiMatchedTo: true },
          orderBy: { uploadedAt: "desc" },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return Response.json({ submissions });
  } catch (error) {
    console.error("Error fetching staff submissions:", error);
    return Response.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
