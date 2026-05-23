import { type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, department } = session.user;
    if (role !== "ADMIN" && !(role === "MANAGER" && department === "LEGAL")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    const template = await prisma.documentTemplate.findUnique({
      where: { id },
      include: {
        processType: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!template) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    return Response.json({ template });
  } catch (error) {
    console.error("Error fetching template:", error);
    return Response.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, department } = session.user;
    if (role !== "ADMIN" && !(role === "MANAGER" && department === "LEGAL")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { name, description, processTypeId, content } = body;

    const existing = await prisma.documentTemplate.findUnique({
      where: { id },
    });
    if (!existing) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (processTypeId !== undefined) data.processTypeId = processTypeId || null;
    if (content !== undefined) {
      data.content = content;
      // Re-extract placeholders
      const matches = content.match(/\{\{(\w+)\}\}/g) || [];
      data.placeholders = [
        ...new Set(matches.map((m: string) => m.replace(/\{\{|\}\}/g, ""))),
      ];
    }

    const template = await prisma.documentTemplate.update({
      where: { id },
      data,
      include: {
        processType: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return Response.json({ template });
  } catch (error) {
    console.error("Error updating template:", error);
    return Response.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, department } = session.user;
    if (role !== "ADMIN" && !(role === "MANAGER" && department === "LEGAL")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    const existing = await prisma.documentTemplate.findUnique({
      where: { id },
    });
    if (!existing) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    await prisma.documentTemplate.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return Response.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
