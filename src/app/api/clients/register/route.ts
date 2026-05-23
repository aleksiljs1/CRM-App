import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "PARTNER", "MANAGER"].includes(session.user.role)) {
      return Response.json({ error: "Only managers can register clients" }, { status: 403 });
    }

    const body = await request.json();
    const { companyName, contactName, contactEmail, phone, industry } = body;

    if (!companyName?.trim() || !contactName?.trim() || !contactEmail?.trim()) {
      return Response.json(
        { error: "Company name, contact name, and email are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.client.findFirst({
      where: { contactEmail: contactEmail.trim() },
    });
    if (existing) {
      return Response.json(
        { error: "A client with this email already exists" },
        { status: 409 }
      );
    }

    const client = await prisma.client.create({
      data: {
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        phone: phone?.trim() || null,
        industry: industry?.trim() || null,
        status: "ACTIVE",
        assignedToId: session.user.id,
      },
    });

    // Also create a User account for the client so they can log in
    const bcrypt = await import("bcryptjs");
    const defaultPassword = await bcrypt.hash("client123", 10);

    await prisma.user.upsert({
      where: { email: contactEmail.trim() },
      update: {},
      create: {
        email: contactEmail.trim(),
        name: contactName.trim(),
        password: defaultPassword,
        role: "CLIENT",
        department: null,
      },
    });

    return Response.json({ client });
  } catch (error) {
    console.error("Error registering client:", error);
    return Response.json({ error: "Failed to register client" }, { status: 500 });
  }
}
