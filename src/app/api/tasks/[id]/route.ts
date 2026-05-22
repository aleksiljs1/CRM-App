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

    // Department check: user must belong to the task's department (or be ADMIN/PARTNER)
    const userRole = session.user.role;
    const userDept = session.user.department;
    const isAdminOrPartner = userRole === "ADMIN" || userRole === "PARTNER";

    if (!isAdminOrPartner && task.department && task.department !== userDept) {
      return Response.json(
        { error: "You do not have permission to view this task" },
        { status: 403 }
      );
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

    // Department check: user must belong to the task's department (or be ADMIN/PARTNER)
    const userRole = session.user.role;
    const userDept = session.user.department;
    const isAdminOrPartner = userRole === "ADMIN" || userRole === "PARTNER";

    if (!isAdminOrPartner && task.department && task.department !== userDept) {
      return Response.json(
        { error: "You do not have permission to update this task" },
        { status: 403 }
      );
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

      // Role-based status transition restrictions
      const juniorRoles = ["JUNIOR", "ASSISTANT", "INTERN"];
      const seniorRoles = ["SENIOR", "ASSOCIATE"];
      const managerRoles = ["MANAGER", "PARTNER", "ADMIN"];

      if (juniorRoles.includes(userRole)) {
        // Can only: TODO->IN_PROGRESS, IN_PROGRESS->REVIEW
        const allowed =
          (currentStatus === "TODO" && status === "IN_PROGRESS") ||
          (currentStatus === "IN_PROGRESS" && status === "REVIEW");
        if (!allowed) {
          return Response.json(
            { error: `Your role (${userRole}) cannot perform the transition: ${currentStatus} -> ${status}` },
            { status: 403 }
          );
        }
      } else if (seniorRoles.includes(userRole)) {
        // Can do junior transitions + REVIEW->IN_PROGRESS (send back)
        const allowed =
          (currentStatus === "TODO" && status === "IN_PROGRESS") ||
          (currentStatus === "IN_PROGRESS" && status === "REVIEW") ||
          (currentStatus === "REVIEW" && status === "IN_PROGRESS");
        if (!allowed) {
          return Response.json(
            { error: `Your role (${userRole}) cannot perform the transition: ${currentStatus} -> ${status}` },
            { status: 403 }
          );
        }
      }
      // MANAGER, PARTNER, ADMIN can do ALL transitions (no restriction needed)
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
