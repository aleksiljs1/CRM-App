import { type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_TRANSITIONS: Record<string, string[]> = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["REVIEW"],
  REVIEW: ["APPROVED", "IN_PROGRESS"],
  APPROVED: ["COMPLETED"],
  COMPLETED: [],
};

// Any status can go back to TODO
const RESET_STATUS = "TODO";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
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
        attachments: true,
        statusHistory: {
          include: { changedBy: { select: { id: true, name: true } } },
          orderBy: { changedAt: "asc" },
        },
      },
    });

    if (!task) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    return Response.json({ task });
  } catch (error) {
    console.error("Error fetching task:", error);
    return Response.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, assignedToId } = body;

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    // Validate workflow transition
    if (status) {
      const currentStatus = task.status;
      const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

      // Allow reset to TODO from any status
      const isValidTransition =
        status === RESET_STATUS || allowedTransitions.includes(status);

      if (!isValidTransition) {
        return Response.json(
          {
            error: `Invalid transition: ${currentStatus} -> ${status}. Allowed: ${[
              ...allowedTransitions,
              RESET_STATUS,
            ].join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    const data: Record<string, unknown> = {};

    if (status) {
      data.status = status;

      if (status === "COMPLETED") {
        data.completedAt = new Date();
      } else if (task.status === "COMPLETED" && status !== "COMPLETED") {
        data.completedAt = null;
      }

      // Create status history record alongside the update
      data.statusHistory = {
        create: {
          fromStatus: task.status,
          toStatus: status,
          changedById: session.user.id,
        },
      };
    }

    if (assignedToId !== undefined) {
      data.assignedToId = assignedToId;
    }

    const updated = await prisma.task.update({
      where: { id },
      data,
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
        attachments: true,
        statusHistory: {
          include: { changedBy: { select: { id: true, name: true } } },
          orderBy: { changedAt: "asc" },
        },
      },
    });

    return Response.json({ task: updated });
  } catch (error) {
    console.error("Error updating task:", error);
    return Response.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}
