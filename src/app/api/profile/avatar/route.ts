import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const MAX_AVATAR_BYTES = 4 * 1024 * 1024; // 4 MB

const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

// Safely delete the previous avatar file if it lives inside our uploads/avatars
// directory. Skips remote URLs and anything outside that folder.
async function tryDeletePreviousAvatar(previous: string | null) {
  if (!previous) return;
  if (!previous.startsWith("/uploads/avatars/")) return;
  try {
    const rel = previous.replace(/^\/+/, "");
    const fullPath = path.join(process.cwd(), "public", rel);
    const expectedRoot = path.join(process.cwd(), "public", "uploads", "avatars");
    // path traversal guard
    if (!fullPath.startsWith(expectedRoot)) return;
    await unlink(fullPath);
  } catch {
    // best-effort cleanup; ignore if the file is already gone
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return Response.json(
        { error: "Invalid form data" },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    if (!file || !(file instanceof File) || file.size === 0) {
      return Response.json(
        { error: "No file uploaded" },
        { status: 422 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return Response.json(
        {
          error:
            "Unsupported file type. Please upload a PNG, JPG, WebP, or GIF image.",
        },
        { status: 422 }
      );
    }

    if (file.size > MAX_AVATAR_BYTES) {
      return Response.json(
        { error: "Image is too large. Maximum size is 4 MB." },
        { status: 422 }
      );
    }

    // Resolve a safe extension based on mime, falling back to the original ext
    const fallbackExt = path.extname(file.name).toLowerCase();
    const ext = EXT_BY_MIME[file.type] || (fallbackExt || ".png");

    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadDir, { recursive: true });

    const uniqueName = `${session.user.id}-${crypto.randomUUID()}${ext}`;
    const fullPath = path.join(uploadDir, uniqueName);
    const publicPath = `/uploads/avatars/${uniqueName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(fullPath, buffer);

    // Read previous avatar so we can clean it up after a successful DB update
    let previousAvatar: string | null = null;
    try {
      const existing = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { avatar: true },
      });
      previousAvatar = existing?.avatar ?? null;

      await prisma.user.update({
        where: { id: session.user.id },
        data: { avatar: publicPath },
      });
    } catch (dbError) {
      console.error("Avatar DB update failed:", dbError);
      // Roll back the file we just wrote so we don't leave orphans
      try {
        await unlink(fullPath);
      } catch {
        /* ignore */
      }
      return Response.json(
        { error: "Failed to update avatar" },
        { status: 500 }
      );
    }

    // Fire-and-forget cleanup of the prior avatar
    void tryDeletePreviousAvatar(previousAvatar);

    return Response.json({ avatar: publicPath });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return Response.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let previousAvatar: string | null = null;
    try {
      const existing = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { avatar: true },
      });
      previousAvatar = existing?.avatar ?? null;

      await prisma.user.update({
        where: { id: session.user.id },
        data: { avatar: null },
      });
    } catch (dbError) {
      console.error("Avatar DB delete failed:", dbError);
      return Response.json(
        { error: "Failed to remove avatar" },
        { status: 500 }
      );
    }

    void tryDeletePreviousAvatar(previousAvatar);

    return Response.json({ avatar: null });
  } catch (error) {
    console.error("Error removing avatar:", error);
    return Response.json(
      { error: "Failed to remove avatar" },
      { status: 500 }
    );
  }
}
