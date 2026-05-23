import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import type { Role, Department } from "@/generated/prisma/enums";

// ── Helper: verify ADMIN ────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", status: 401 };
  if (session.user.role !== "ADMIN") return { error: "Forbidden", status: 403 };
  return { session };
}

// ── GET — list users with filters ───────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const sp = request.nextUrl.searchParams;
    const search = sp.get("search") || "";
    const department = sp.get("department") || "";
    const role = sp.get("role") || "";
    const active = sp.get("active"); // "true" | "false" | null

    const where: Record<string, unknown> = {};

    if (department) where.department = department;
    if (role) where.role = role;
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;

    if (search.trim()) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subRole: true,
        department: true,
        isActive: true,
        createdAt: true,
      },
    });

    return Response.json({ users });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return Response.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// ── POST — create user ──────────────────────────────────────────────────────

const NON_CLIENT_ROLES: Role[] = [
  "ADMIN",
  "PARTNER",
  "MANAGER",
  "SENIOR",
  "ASSOCIATE",
  "JUNIOR",
  "ASSISTANT",
  "INTERN",
];

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { name, email, password, role, subRole, department } = body;

    if (!name || !email || !password || !role) {
      return Response.json(
        { error: "Name, email, password, and role are required" },
        { status: 400 }
      );
    }

    if (!NON_CLIENT_ROLES.includes(role)) {
      return Response.json(
        { error: `Invalid role. CLIENT role cannot be created here.` },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as Role,
        subRole: subRole || null,
        department: (department as Department) || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subRole: true,
        department: true,
        isActive: true,
        createdAt: true,
      },
    });

    return Response.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Admin users POST error:", error);
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }
}

// ── PATCH — update user ─────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { id, name, email, role, subRole, department, isActive, resetPassword } = body;

    if (!id) {
      return Response.json({ error: "User id is required" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};

    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (role !== undefined) {
      if (!NON_CLIENT_ROLES.includes(role)) {
        return Response.json({ error: "Invalid role" }, { status: 400 });
      }
      data.role = role;
    }
    if (subRole !== undefined) data.subRole = subRole || null;
    if (department !== undefined) data.department = department || null;
    if (isActive !== undefined) data.isActive = isActive;

    if (resetPassword) {
      data.password = await bcrypt.hash("reset123", 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subRole: true,
        department: true,
        isActive: true,
        createdAt: true,
      },
    });

    return Response.json({ user: updated });
  } catch (error) {
    console.error("Admin users PATCH error:", error);
    return Response.json({ error: "Failed to update user" }, { status: 500 });
  }
}
