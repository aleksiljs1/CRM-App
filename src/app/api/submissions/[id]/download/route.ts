import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/submissions/[id]/download
 * Streams a client-submitted document from the database (so it survives
 * redeploys). Access:
 *  - ADMIN / PARTNER: any document
 *  - other staff: documents for processes in their department
 *  - the owning CLIENT: their own documents
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const doc = await prisma.submittedDocument.findUnique({
      where: { id },
      include: {
        submission: {
          include: {
            processType: { select: { department: true } },
            client: { select: { contactEmail: true } },
          },
        },
      },
    });

    if (!doc || !doc.data) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const role = session.user.role;
    const isFirmWide = role === "ADMIN" || role === "PARTNER";
    const sameDept =
      !!session.user.department &&
      session.user.department === doc.submission.processType.department;
    const isOwnerClient =
      role === "CLIENT" &&
      !!session.user.email &&
      session.user.email === doc.submission.client?.contactEmail;

    if (!isFirmWide && !sameDept && !isOwnerClient) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const bytes = new Uint8Array(doc.data);
    return new Response(bytes, {
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          doc.fileName
        )}"`,
        "Content-Length": String(bytes.length),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return Response.json({ error: "Failed to download" }, { status: 500 });
  }
}
