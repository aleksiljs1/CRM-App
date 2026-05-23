import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/client/contacts — the staff a CLIENT-role user is allowed to chat with.
// Returns: their assigned account manager + every staff member assigned to one
// of their tasks (deduped). Used by the "Talk to your team" section on the
// client dashboard.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "CLIENT") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!session.user.email) {
      return Response.json({ contacts: [] });
    }

    const client = await prisma.client.findFirst({
      where: { contactEmail: session.user.email },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
          },
        },
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      return Response.json({ contacts: [] });
    }

    type Contact = {
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
        department: string | null;
      };
      relationship: "manager" | "task";
      context: string;
    };

    const contacts: Contact[] = [];
    const seenIds = new Set<string>();

    // 1) Account manager first — highest priority context.
    if (client.assignedTo) {
      contacts.push({
        user: client.assignedTo,
        relationship: "manager",
        context: "Your account manager",
      });
      seenIds.add(client.assignedTo.id);
    }

    // 2) Anyone assigned to one of this client's tasks (dedup against manager).
    for (const task of client.tasks) {
      if (!task.assignedTo) continue;
      if (seenIds.has(task.assignedTo.id)) continue;
      seenIds.add(task.assignedTo.id);
      contacts.push({
        user: task.assignedTo,
        relationship: "task",
        context: `Working on: ${task.title}`,
      });
    }

    return Response.json({ contacts });
  } catch (error) {
    console.error("Error fetching client contacts:", error);
    return Response.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}
