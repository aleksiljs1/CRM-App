import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "PARTNER"].includes(session.user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const processes = await prisma.processType.findMany({
      include: {
        requiredDocuments: true,
        submissions: {
          include: {
            client: { select: { id: true, companyName: true, contactName: true } },
            documents: { select: { id: true, aiMatchedToId: true } },
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            assignedTo: { select: { name: true } },
            requiredDocument: { select: { documentName: true } },
          },
        },
        _count: {
          select: { submissions: true, tasks: true, requiredDocuments: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const stats = processes.map((proc) => {
      const clientDocs = proc.requiredDocuments.filter((d) => d.source === "CLIENT");
      const internalDocs = proc.requiredDocuments.filter((d) => d.source === "INTERNAL");

      const submissionStats = proc.submissions.map((sub) => {
        const matchedCount = sub.documents.filter((d) => d.aiMatchedToId).length;
        return {
          id: sub.id,
          client: sub.client,
          status: sub.status,
          uploadedDocs: sub.documents.length,
          matchedDocs: matchedCount,
          totalRequired: clientDocs.length,
          completionPct: clientDocs.length > 0 ? Math.round((matchedCount / clientDocs.length) * 100) : 0,
        };
      });

      const taskStats = proc.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        assignedTo: t.assignedTo?.name || "Unassigned",
        documentName: t.requiredDocument?.documentName || null,
      }));

      return {
        id: proc.id,
        name: proc.name,
        department: proc.department,
        description: proc.description,
        isActive: proc.isActive,
        clientDocsCount: clientDocs.length,
        internalDocsCount: internalDocs.length,
        totalSubmissions: proc._count.submissions,
        totalTasks: proc._count.tasks,
        submissions: submissionStats,
        tasks: taskStats,
      };
    });

    return Response.json({ stats });
  } catch (error) {
    console.error("Error fetching process stats:", error);
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
