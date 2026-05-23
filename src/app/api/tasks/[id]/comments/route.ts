import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/tasks/[id]/comments — list comments on a task (newest first).
// All authenticated users who can see the task can see its comments.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: taskId } = await params;

    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    return Response.json({ comments });
  } catch (error) {
    console.error("Error fetching task comments:", error);
    return Response.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/comments — add a new comment.
// Any authenticated user can comment; visible to everyone on the team.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: taskId } = await params;

    const payload = await req.json().catch(() => null);
    const body = payload && typeof payload.body === "string" ? payload.body.trim() : "";
    if (!body) {
      return Response.json(
        { error: "Comment body is required" },
        { status: 400 }
      );
    }
    if (body.length > 2000) {
      return Response.json(
        { error: "Comment is too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true },
    });
    if (!task) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        authorId: session.user.id,
        body,
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    return Response.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Error creating task comment:", error);
    return Response.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
