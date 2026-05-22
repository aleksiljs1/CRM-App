import { type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List user's conversations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Find conversations where user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                subRole: true,
                department: true,
                avatar: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Calculate unread count for each conversation
    const conversationsWithUnread = conversations.map((conv) => {
      const myParticipant = conv.participants.find((p) => p.userId === userId);
      const lastReadAt = myParticipant?.lastReadAt;

      // We'll count unread as messages after lastReadAt (if set)
      // For efficiency, just check if last message is after lastReadAt
      const lastMessage = conv.messages[0] || null;
      let hasUnread = false;
      if (lastMessage && lastMessage.senderId !== userId) {
        if (!lastReadAt || lastMessage.createdAt > lastReadAt) {
          hasUnread = true;
        }
      }

      return {
        id: conv.id,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        participants: conv.participants,
        lastMessage,
        hasUnread,
      };
    });

    return Response.json({ conversations: conversationsWithUnread });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return Response.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST - Start or find a conversation with a user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return Response.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const currentUserId = session.user.id;
    if (userId === currentUserId) {
      return Response.json(
        { error: "Cannot start a conversation with yourself" },
        { status: 400 }
      );
    }

    // Check if a 1:1 conversation already exists between these two users
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: currentUserId } } },
          { participants: { some: { userId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                subRole: true,
                department: true,
                avatar: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // Verify it's a 2-person conversation (not a group chat if we ever add that)
    if (existing && existing.participants.length === 2) {
      return Response.json({ conversation: existing });
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: currentUserId }, { userId }],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                subRole: true,
                department: true,
                avatar: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return Response.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return Response.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
