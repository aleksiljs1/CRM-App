import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "ADMIN") {
    return { error: Response.json({ error: "Forbidden: ADMIN only" }, { status: 403 }) };
  }
  return { session };
}

// GET — list all process types with required documents, grouped by department
export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const processTypes = await prisma.processType.findMany({
      include: {
        requiredDocuments: true,
        _count: { select: { requiredDocuments: true } },
      },
      orderBy: [{ department: "asc" }, { name: "asc" }],
    });

    return Response.json(processTypes);
  } catch (error) {
    console.error("Error fetching process types:", error);
    return Response.json({ error: "Failed to fetch process types" }, { status: 500 });
  }
}

// POST — create a process type OR add a required document
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const body = await request.json();

    // If processTypeId is present, we're adding a required document
    if (body.processTypeId) {
      const doc = await prisma.requiredDocument.create({
        data: {
          processTypeId: body.processTypeId,
          documentName: body.documentName,
          description: body.description || null,
          isMandatory: body.isMandatory ?? true,
        },
      });
      return Response.json(doc, { status: 201 });
    }

    // Otherwise, create a new process type
    const processType = await prisma.processType.create({
      data: {
        name: body.name,
        department: body.department,
        description: body.description || null,
        isActive: body.isActive ?? true,
        createdById: auth.session!.user.id,
      },
      include: {
        requiredDocuments: true,
        _count: { select: { requiredDocuments: true } },
      },
    });

    return Response.json(processType, { status: 201 });
  } catch (error) {
    console.error("Error creating:", error);
    return Response.json({ error: "Failed to create" }, { status: 500 });
  }
}

// PATCH — update a process type
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return Response.json({ error: "Missing id" }, { status: 400 });
    }

    const updated = await prisma.processType.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.department !== undefined && { department: data.department }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        requiredDocuments: true,
        _count: { select: { requiredDocuments: true } },
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("Error updating process type:", error);
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE — delete a process type or a required document
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");
    const type = searchParams.get("type"); // "process" or "document"

    if (!id) {
      return Response.json({ error: "Missing id" }, { status: 400 });
    }

    if (type === "document") {
      await prisma.requiredDocument.delete({ where: { id } });
    } else {
      await prisma.processType.delete({ where: { id } });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting:", error);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
