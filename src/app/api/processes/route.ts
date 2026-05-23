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

    const role = session.user.role;
    const userDept = session.user.department;
    const deptFilter = request.nextUrl.searchParams.get("department");

    // Only ADMIN, PARTNER, and MANAGER can access
    if (!["ADMIN", "PARTNER", "MANAGER"].includes(role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const where: Record<string, unknown> = { isActive: true };

    if (role === "ADMIN" || role === "PARTNER") {
      // Admin/Partner can see all, optionally filter
      if (deptFilter) {
        where.department = deptFilter;
      }
    } else {
      // Manager: only their department
      if (userDept) {
        where.department = userDept;
      }
    }

    const processes = await prisma.processType.findMany({
      where,
      include: {
        requiredDocuments: true,
        submissions: {
          include: {
            client: { select: { id: true, companyName: true, contactName: true } },
          },
        },
        _count: { select: { requiredDocuments: true, submissions: true } },
      },
      orderBy: [{ department: "asc" }, { name: "asc" }],
    });

    return Response.json({ processes });
  } catch (error) {
    console.error("Error fetching processes:", error);
    return Response.json(
      { error: "Failed to fetch processes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const userDept = session.user.department;

    if (!["ADMIN", "PARTNER", "MANAGER"].includes(role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, department, description, documents, clientId } = body;

    if (!name || !department) {
      return Response.json(
        { error: "Name and department are required" },
        { status: 400 }
      );
    }

    // Managers can only create for their own department
    if (role === "MANAGER" && userDept && department !== userDept) {
      return Response.json(
        { error: "You can only create processes for your department" },
        { status: 403 }
      );
    }

    const process = await prisma.processType.create({
      data: {
        name,
        department,
        description: description || null,
        createdById: session.user.id,
        requiredDocuments: {
          create: (documents || []).map(
            (doc: {
              name: string;
              description?: string;
              source?: string;
              isMandatory?: boolean;
            }) => ({
              documentName: doc.name,
              description: doc.description || null,
              source: doc.source || "CLIENT",
              isMandatory: doc.isMandatory ?? true,
            })
          ),
        },
      },
      include: {
        requiredDocuments: true,
        _count: { select: { requiredDocuments: true } },
      },
    });

    // If a client is attached, create a submission for them
    if (clientId) {
      await prisma.clientSubmission.create({
        data: {
          clientId,
          processTypeId: process.id,
          status: "INCOMPLETE",
        },
      });
    }

    return Response.json({ process }, { status: 201 });
  } catch (error) {
    console.error("Error creating process:", error);
    return Response.json(
      { error: "Failed to create process" },
      { status: 500 }
    );
  }
}
