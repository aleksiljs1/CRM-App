import { type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";

    const where: any = {};

    if (status && ["LEAD", "ACTIVE", "INACTIVE"].includes(status)) {
      where.status = status;
    }

    if (search.trim()) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        submissions: {
          include: {
            processType: { select: { id: true, name: true, department: true } },
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
            priority: true,
            deadline: true,
          },
        },
        emails: {
          select: {
            id: true,
            isIncoming: true,
            isReplied: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return Response.json({ clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return Response.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}
