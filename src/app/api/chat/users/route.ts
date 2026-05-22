import { type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Department } from "@/generated/prisma/enums";

// GET - Search users for chat
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") as Department | null;

    const where: Record<string, unknown> = {
      id: { not: session.user.id },
      role: { not: "CLIENT" },
      isActive: true,
    };

    if (search.trim()) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (department) {
      where.department = department;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subRole: true,
        department: true,
        avatar: true,
      },
      take: 20,
      orderBy: { name: "asc" },
    });

    return Response.json({ users });
  } catch (error) {
    console.error("Error searching users:", error);
    return Response.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
