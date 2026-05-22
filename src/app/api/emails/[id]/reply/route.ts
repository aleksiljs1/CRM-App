import nodemailer from "nodemailer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Block CLIENT role from replying
    if (session.user.role === "CLIENT") {
      return Response.json(
        { error: "Clients are not allowed to reply to emails" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const formData = await request.formData();

    const body = formData.get("body");
    if (!body || typeof body !== "string") {
      return Response.json(
        { error: "Reply body is required" },
        { status: 400 }
      );
    }

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

    const originalEmail = await prisma.email.findUnique({
      where: { id },
    });

    if (!originalEmail) {
      return Response.json({ error: "Email not found" }, { status: 404 });
    }

    // Department check: user must belong to the email's department (or be ADMIN/PARTNER)
    const userRole = session.user.role;
    const userDept = session.user.department;
    const isAdminOrPartner = userRole === "ADMIN" || userRole === "PARTNER";

    if (!isAdminOrPartner && originalEmail.recipientDept !== userDept) {
      return Response.json(
        { error: "You do not have permission to reply to this email" },
        { status: 403 }
      );
    }

    // Save files to disk
    const savedFiles: {
      originalName: string;
      uniqueName: string;
      fullPath: string;
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
        fullPath,
        size: buffer.length,
        mimeType: file.type,
      });
    }

    // Build subject line, avoid double "Re:"
    const subject = originalEmail.subject.startsWith("Re:")
      ? originalEmail.subject
      : `Re: ${originalEmail.subject}`;

    // Create reply record in DB
    const reply = await prisma.email.create({
      data: {
        threadId: originalEmail.threadId,
        parentId: originalEmail.id,
        senderEmail: "hr@kreston.al",
        senderName: session.user.name || "HR Department",
        recipientDept: originalEmail.recipientDept,
        subject,
        body,
        isIncoming: false,
        isReplied: true,
        userId: session.user.id,
        attachments: {
          create: savedFiles.map((f) => ({
            fileName: f.originalName,
            filePath: `/documents/${f.uniqueName}`,
            fileSize: f.size,
            mimeType: f.mimeType,
          })),
        },
      },
      include: {
        attachments: true,
      },
    });

    // Mark original as replied
    await prisma.email.update({
      where: { id: originalEmail.id },
      data: { isReplied: true, repliedAt: new Date() },
    });

    // Send actual email via SMTP if configured
    if (process.env.SMTP_USER) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"HR Department" <hr@kreston.al>`,
          to: originalEmail.senderEmail,
          subject,
          text: body,
          attachments: savedFiles.map((f) => ({
            filename: f.originalName,
            path: f.fullPath,
          })),
        });
      } catch (smtpError) {
        console.error("SMTP send failed:", smtpError);
        // Don't fail the request - email is saved in DB
      }
    } else {
      console.log("SMTP not configured, skipping send");
    }

    return Response.json(reply);
  } catch (error) {
    console.error("Error sending reply:", error);
    return Response.json(
      { error: "Failed to send reply" },
      { status: 500 }
    );
  }
}
