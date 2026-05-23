import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";
import type { ClientStatus } from "@/generated/prisma/enums";

// ── Helper: verify ADMIN ────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", status: 401 };
  if (session.user.role !== "ADMIN") return { error: "Forbidden", status: 403 };
  return { session };
}

// ── GET — list clients with filters ─────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const sp = request.nextUrl.searchParams;
    const search = sp.get("search") || "";
    const status = sp.get("status") || "";
    const industry = sp.get("industry") || "";

    const where: Record<string, unknown> = {};

    if (status && ["LEAD", "ACTIVE", "INACTIVE"].includes(status)) {
      where.status = status;
    }
    if (industry) {
      where.industry = industry;
    }
    if (search.trim()) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Also fetch employees for the assign dropdown
    const employees = await prisma.user.findMany({
      where: { role: { not: "CLIENT" }, isActive: true },
      select: { id: true, name: true, email: true, department: true },
      orderBy: { name: "asc" },
    });

    // Distinct industries for the filter
    const allClients = await prisma.client.findMany({
      where: { industry: { not: null } },
      select: { industry: true },
      distinct: ["industry"],
    });
    const industries = allClients
      .map((c) => c.industry)
      .filter(Boolean) as string[];

    return Response.json({ clients, employees, industries });
  } catch (error) {
    console.error("Admin clients GET error:", error);
    return Response.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

// ── POST — create client ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const {
      companyName,
      contactName,
      contactEmail,
      phone,
      industry,
      status,
      assignedToId,
    } = body;

    if (!companyName || !contactName || !contactEmail) {
      return Response.json(
        { error: "Company name, contact name, and contact email are required" },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        companyName,
        contactName,
        contactEmail,
        phone: phone || null,
        industry: industry || null,
        status: (status as ClientStatus) || "LEAD",
        assignedToId: assignedToId || null,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return Response.json({ client }, { status: 201 });
  } catch (error) {
    console.error("Admin clients POST error:", error);
    return Response.json({ error: "Failed to create client" }, { status: 500 });
  }
}

// ── PATCH — update client ───────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const {
      id,
      companyName,
      contactName,
      contactEmail,
      phone,
      industry,
      status,
      assignedToId,
    } = body;

    if (!id) {
      return Response.json({ error: "Client id is required" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (companyName !== undefined) data.companyName = companyName;
    if (contactName !== undefined) data.contactName = contactName;
    if (contactEmail !== undefined) data.contactEmail = contactEmail;
    if (phone !== undefined) data.phone = phone || null;
    if (industry !== undefined) data.industry = industry || null;
    if (status !== undefined) data.status = status;
    if (assignedToId !== undefined) data.assignedToId = assignedToId || null;

    const client = await prisma.client.update({
      where: { id },
      data,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return Response.json({ client });
  } catch (error) {
    console.error("Admin clients PATCH error:", error);
    return Response.json({ error: "Failed to update client" }, { status: 500 });
  }
}

// ── DELETE — delete client ──────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Client id is required" }, { status: 400 });
    }

    await prisma.client.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Admin clients DELETE error:", error);
    return Response.json({ error: "Failed to delete client" }, { status: 500 });
  }
}
