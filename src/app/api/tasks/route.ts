import { type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type { TaskPriority, Department } from "@/generated/prisma/enums";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const department = session.user.department;
    const role = session.user.role;
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
    } else {
      // When not filtering by "mine", filter by department
      // ADMIN and PARTNER (department=null) see ALL tasks across departments
      if (department && role !== "ADMIN" && role !== "PARTNER") {
        where.department = department;
      } else if (!department && role !== "ADMIN" && role !== "PARTNER") {
        where.department = "HR"; // fallback
      }
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
          select: { id: true, name: true, email: true, role: true, subRole: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true, subRole: true },
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

    // Count tasks per status (matching the same filters)
    const baseWhere: Record<string, unknown> = {};
    if (mine) {
      baseWhere.assignedToId = session.user.id;
    } else {
      if (department && role !== "ADMIN" && role !== "PARTNER") {
        baseWhere.department = department;
      } else if (!department && role !== "ADMIN" && role !== "PARTNER") {
        baseWhere.department = "HR";
      }
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

    // Only ADMIN, PARTNER, MANAGER can create tasks
    if (!["ADMIN", "PARTNER", "MANAGER"].includes(session.user.role)) {
      return Response.json({ error: "Only managers can create tasks" }, { status: 403 });
    }

    const formData = await request.formData();

    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const priority = formData.get("priority") as string | null;
    const deadline = formData.get("deadline") as string | null;
    const department = formData.get("department") as string | null;
    const assignedToIdRaw = formData.get("assignedToId") as string | null;
    const clientId = formData.get("clientId") as string | null;

    if (!title || !title.trim()) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    // If assignedToId is empty string or "unassigned", treat as null (unassigned)
    const assignedToId =
      !assignedToIdRaw || assignedToIdRaw === "" || assignedToIdRaw === "unassigned"
        ? null
        : assignedToIdRaw;

    const files = formData.getAll("attachments") as File[];

    // Validate mime types
    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return Response.json(
          {
            error: `File type not allowed: ${file.type}. Allowed types: PDF, Word, Excel.`,
          },
          { status: 400 }
        );
      }
    }

    // Save files to disk
    const savedFiles: {
      originalName: string;
      uniqueName: string;
      size: number;
      mimeType: string;
    }[] = [];

    for (const file of files) {
      const ext = path.extname(file.name);
      const uniqueName = `${crypto.randomUUID()}${ext}`;
      const fullPath = path.join(
        process.cwd(),
        "public",
        "documents",
        uniqueName
      );
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(fullPath, buffer);
      savedFiles.push({
        originalName: file.name,
        uniqueName,
        size: buffer.length,
        mimeType: file.type,
      });
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description || null,
        priority: (priority || "MEDIUM") as TaskPriority,
        deadline: deadline ? new Date(deadline) : null,
        department: (department || session.user.department || null) as Department | null,
        clientId: clientId || null,
        assignedToId: assignedToId,
        createdById: session.user.id,
        attachments: {
          create: savedFiles.map((f) => ({
            fileName: f.originalName,
            filePath: `/documents/${f.uniqueName}`,
            fileSize: f.size,
            mimeType: f.mimeType,
          })),
        },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: "TODO",
            changedById: session.user.id,
          },
        },
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true, subRole: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true, subRole: true },
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

    return Response.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return Response.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
