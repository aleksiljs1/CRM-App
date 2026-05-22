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
    const mine = searchParams.get("mine") !== "false"; // default true
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};

    if (
      status &&
      ["TODO", "IN_PROGRESS", "REVIEW", "APPROVED", "COMPLETED"].includes(
        status
      )
    ) {
      where.status = status;
    }

    if (mine) {
      where.assignedToId = session.user.id;
    }

    if (search.trim()) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ priority: "desc" }, { deadline: "asc" }],
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        client: {
          select: { id: true, companyName: true },
        },
      },
    });

    // Sort by priority order (URGENT first) then deadline
    tasks.sort((a, b) => {
      const pa =
        priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
      const pb =
        priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
      if (pa !== pb) return pa - pb;
      if (a.deadline && b.deadline)
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    });

    const now = new Date();

    // Count tasks per status (for the current user filter)
    const baseWhere: Record<string, unknown> = {};
    if (mine) {
      baseWhere.assignedToId = session.user.id;
    }

    const allTasks = await prisma.task.findMany({
      where: baseWhere,
      select: { status: true, deadline: true },
    });

    const counts = {
      todo: allTasks.filter((t) => t.status === "TODO").length,
      inProgress: allTasks.filter((t) => t.status === "IN_PROGRESS").length,
      review: allTasks.filter((t) => t.status === "REVIEW").length,
      approved: allTasks.filter((t) => t.status === "APPROVED").length,
      completed: allTasks.filter((t) => t.status === "COMPLETED").length,
      overdue: allTasks.filter(
        (t) =>
          t.deadline &&
          new Date(t.deadline) < now &&
          t.status !== "COMPLETED"
      ).length,
    };

    return Response.json({ tasks, counts });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return Response.json(
      { error: "Failed to fetch tasks" },
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

    const body = await request.json();
    const { title, description, priority, deadline, department, clientId, assignedToId } = body;

    if (!title || !title.trim()) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description || null,
        priority: priority || "MEDIUM",
        deadline: deadline ? new Date(deadline) : null,
        department: department || null,
        clientId: clientId || null,
        assignedToId: assignedToId || session.user.id,
        createdById: session.user.id,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        client: {
          select: { id: true, companyName: true },
        },
      },
    });

    return Response.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return Response.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
