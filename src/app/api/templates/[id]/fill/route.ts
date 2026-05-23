import { type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
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
    const { values } = body;

    if (!values || typeof values !== "object") {
      return Response.json(
        { error: "Values object is required" },
        { status: 400 }
      );
    }

    const template = await prisma.documentTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    // Replace all {{placeholder}} with provided values
    let filledContent = template.content;
    for (const [key, value] of Object.entries(values)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      filledContent = filledContent.replace(regex, String(value));
    }

    return Response.json({
      filledContent,
      templateName: template.name,
    });
  } catch (error) {
    console.error("Error filling template:", error);
    return Response.json(
      { error: "Failed to fill template" },
      { status: 500 }
    );
  }
}
