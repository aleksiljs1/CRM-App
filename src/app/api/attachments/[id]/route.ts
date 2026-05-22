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

    const attachment = await prisma.emailAttachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      return Response.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    const filePath = path.join(process.cwd(), "public", attachment.filePath);

    let fileBuffer: Buffer;
    try {
      fileBuffer = await readFile(filePath);
    } catch {
      return Response.json(
        { error: "File not found on disk" },
        { status: 404 }
      );
    }

    return new Response(fileBuffer, {
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
