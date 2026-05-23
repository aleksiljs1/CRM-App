import nodemailer from "nodemailer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "CLIENT") {
      return Response.json(
        { error: "Clients cannot compose emails" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const to = formData.get("to");
    const subject = formData.get("subject");
    const body = formData.get("body");

    if (!to || typeof to !== "string" || !to.includes("@")) {
      return Response.json({ error: "Valid recipient email is required" }, { status: 400 });
    }
    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return Response.json({ error: "Subject is required" }, { status: 400 });
    }
    if (!body || typeof body !== "string" || !body.trim()) {
      return Response.json({ error: "Email body is required" }, { status: 400 });
    }

    const files = formData.getAll("attachments") as File[];

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return Response.json(
          { error: `File type not allowed: ${file.type}. Allowed: PDF, Word, Excel.` },
          { status: 400 }
        );
      }
    }

    // Save attachments to disk
    const docDir = path.join(process.cwd(), "public", "documents");
    await mkdir(docDir, { recursive: true });

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
      const fullPath = path.join(docDir, uniqueName);
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

    // Generate a unique threadId for this new conversation
    const threadId = crypto.randomUUID();

    // Determine department
    const userDept = session.user.department || "HR";

    // Create email record in DB (outgoing)
    const email = await prisma.email.create({
      data: {
        threadId,
        parentId: null,
        senderEmail: process.env.SMTP_USER || "noreply@kreston.al",
        senderName: session.user.name || "Kreston Albania",
        recipientDept: userDept as any,
        subject: subject.trim(),
        body: body.trim(),
        isIncoming: false,
        isRead: true,
        isReplied: false,
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
      include: { attachments: true },
    });

    // Send via SMTP
    if (process.env.SMTP_USER) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: Number(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"${session.user.name || "Kreston Albania"}" <${process.env.SMTP_USER}>`,
          to: to.trim(),
          subject: subject.trim(),
          text: body.trim(),
          attachments: savedFiles.map((f) => ({
            filename: f.originalName,
            path: f.fullPath,
          })),
        });
      } catch (smtpError) {
        console.error("SMTP send failed:", smtpError);
        // Email is saved in DB even if SMTP fails
      }
    }

    return Response.json({ email, message: "Email sent successfully" });
  } catch (error) {
    console.error("Error composing email:", error);
    return Response.json({ error: "Failed to send email" }, { status: 500 });
  }
}
