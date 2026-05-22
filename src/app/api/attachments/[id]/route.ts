import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "node:fs/promises";
import path from "node:path";

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

    // Try EmailAttachment first, then TaskAttachment
    const emailAttachment = await prisma.emailAttachment.findUnique({
      where: { id },
    });

    const attachment = emailAttachment ?? await prisma.taskAttachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      return Response.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    const filePath = path.join(process.cwd(), "public", attachment.filePath);

    const fileBuffer = await readFile(filePath).catch(() => null);
    if (!fileBuffer) {
      return Response.json(
        { error: "File not found on disk" },
        { status: 404 }
      );
    }

    return new Response(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${attachment.fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error downloading attachment:", error);
    return Response.json(
      { error: "Failed to download attachment" },
      { status: 500 }
    );
  }
}
