import { getServerSession } from "next-auth";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_INVITER_ROLES = ["ADMIN", "PARTNER", "MANAGER"] as const;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Avoids ambiguous chars (0/O, 1/I/l) so managers can dictate the password if needed.
const PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const PASSWORD_LENGTH = 10;

function generateTempPassword(): string {
  const bytes = randomBytes(PASSWORD_LENGTH);
  let out = "";
  for (let i = 0; i < PASSWORD_LENGTH; i++) {
    out += PASSWORD_ALPHABET[bytes[i] % PASSWORD_ALPHABET.length];
  }
  return out;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (!ALLOWED_INVITER_ROLES.includes(role as (typeof ALLOWED_INVITER_ROLES)[number])) {
      return Response.json(
        { error: "Forbidden: only ADMIN, PARTNER, or MANAGER can invite clients" },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      companyName,
      contactName,
      contactEmail,
      phone,
      industry,
      assignedToId,
    } = (body ?? {}) as {
      companyName?: unknown;
      contactName?: unknown;
      contactEmail?: unknown;
      phone?: unknown;
      industry?: unknown;
      assignedToId?: unknown;
    };

    // Required fields
    if (
      typeof companyName !== "string" ||
      !companyName.trim() ||
      typeof contactName !== "string" ||
      !contactName.trim() ||
      typeof contactEmail !== "string" ||
      !contactEmail.trim()
    ) {
      return Response.json(
        { error: "companyName, contactName, and contactEmail are required" },
        { status: 422 }
      );
    }

    const normalizedEmail = contactEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return Response.json(
        { error: "contactEmail is not a valid email address" },
        { status: 422 }
      );
    }

    // Optional fields type-check
    if (phone !== undefined && phone !== null && typeof phone !== "string") {
      return Response.json({ error: "phone must be a string" }, { status: 422 });
    }
    if (
      industry !== undefined &&
      industry !== null &&
      typeof industry !== "string"
    ) {
      return Response.json(
        { error: "industry must be a string" },
        { status: 422 }
      );
    }
    if (
      assignedToId !== undefined &&
      assignedToId !== null &&
      typeof assignedToId !== "string"
    ) {
      return Response.json(
        { error: "assignedToId must be a string" },
        { status: 422 }
      );
    }

    // Uniqueness check on User.email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existingUser) {
      return Response.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Verify assignedToId, if provided, is a real internal user
    let finalAssignedToId: string | null = null;
    if (typeof assignedToId === "string" && assignedToId.trim()) {
      const assignee = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { id: true, role: true, isActive: true },
      });
      if (!assignee || !assignee.isActive || assignee.role === "CLIENT") {
        return Response.json(
          { error: "Invalid assignedToId" },
          { status: 422 }
        );
      }
      finalAssignedToId = assignee.id;
    }

    const plaintextPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(plaintextPassword, 10);

    const trimmedPhone =
      typeof phone === "string" && phone.trim() ? phone.trim() : null;
    const trimmedIndustry =
      typeof industry === "string" && industry.trim()
        ? industry.trim()
        : null;

    const client = await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          email: normalizedEmail,
          name: contactName.trim(),
          password: hashedPassword,
          role: "CLIENT",
          department: null,
          isActive: true,
        },
      });

      return tx.client.create({
        data: {
          companyName: companyName.trim(),
          contactName: contactName.trim(),
          contactEmail: normalizedEmail,
          phone: trimmedPhone,
          industry: trimmedIndustry,
          status: "LEAD",
          assignedToId: finalAssignedToId,
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });
    });

    return Response.json(
      {
        client,
        credentials: {
          email: normalizedEmail,
          password: plaintextPassword,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error inviting client:", error);
    return Response.json(
      { error: "Failed to invite client" },
      { status: 500 }
    );
  }
}
