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

    const { role, department } = session.user;

    // Only ADMIN or LEGAL MANAGER
    if (role === "ADMIN") {
      // ok
    } else if (role === "MANAGER" && department === "LEGAL") {
      // ok
    } else {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const processTypeId =
      request.nextUrl.searchParams.get("processTypeId") || undefined;

    const where: Record<string, unknown> = { isActive: true };

    // MANAGER sees only their department
    if (role === "MANAGER") {
      where.department = department;
    }

    if (processTypeId) {
      where.processTypeId = processTypeId;
    }

    const templates = await prisma.documentTemplate.findMany({
      where,
      include: {
        processType: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return Response.json(
      { error: "Failed to fetch templates" },
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

    const { role, department } = session.user;

    if (role === "ADMIN") {
      // ok
    } else if (role === "MANAGER" && department === "LEGAL") {
      // ok
    } else {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, processTypeId, content } = body;

    if (!name || !content) {
      return Response.json(
        { error: "Name and content are required" },
        { status: 400 }
      );
    }

    // Auto-extract placeholders from content
    const matches = content.match(/\{\{(\w+)\}\}/g) || [];
    const placeholders = [
      ...new Set(matches.map((m: string) => m.replace(/\{\{|\}\}/g, ""))),
    ];

    const dept = department || "LEGAL";

    const template = await prisma.documentTemplate.create({
      data: {
        name,
        description: description || null,
        department: dept as any,
        processTypeId: processTypeId || null,
        content,
        placeholders,
        createdById: session.user.id,
      },
      include: {
        processType: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return Response.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return Response.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
