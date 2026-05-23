import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askGemini } from "@/lib/gemini";
import { readFile } from "node:fs/promises";
import path from "node:path";
import pdfParse from "pdf-parse";

const AI_COMPATIBLE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

async function findAttachment(id: string) {
  const task = await prisma.taskAttachment.findUnique({ where: { id } });
  if (task) return task;

  const email = await prisma.emailAttachment.findUnique({ where: { id } });
  if (email) return email;

  const msg = await prisma.messageAttachment.findUnique({ where: { id } });
  if (msg) return msg;

  const manual = await prisma.manualDocument.findUnique({ where: { id } });
  if (manual) return manual;

  return null;
}

async function extractText(filePath: string, mimeType: string): Promise<string> {
  const fullPath = path.join(process.cwd(), "public", filePath);
  const buffer = await readFile(fullPath);

  if (mimeType === "application/pdf") {
    try {
      const result = await pdfParse(buffer);
      return result.text;
    } catch {
      return buffer.toString("utf-8").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }
  }

  if (
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const rawText = buffer.toString("utf-8");
    return rawText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    const rawText = buffer.toString("utf-8");
    return rawText.replace(/<[^>]*>/g, " ").replace(/[^\x20-\x7E\n]/g, " ").replace(/\s+/g, " ").trim();
  }

  return "";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const question = body.question?.trim();

    if (!question) {
      return Response.json({ error: "Question is required" }, { status: 400 });
    }

    const attachment = await findAttachment(id);
    if (!attachment) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    if (!AI_COMPATIBLE_TYPES.includes(attachment.mimeType)) {
      return Response.json(
        { error: "AI analysis is only available for PDF, Word, and Excel files" },
        { status: 400 }
      );
    }

    let text: string;
    try {
      text = await extractText(attachment.filePath, attachment.mimeType);
    } catch {
      text = "Document content could not be fully extracted. Please work with what's available.";
    }

    if (!text || text.length < 10) {
      text = "Document content could not be fully extracted. Please work with what's available.";
    }

    const prompt = `You are a document analyst for Kreston Albania, a professional services firm.

A user has uploaded a document and wants to ask a question about it.

Document name: ${attachment.fileName}
Document type: ${attachment.mimeType}
Document content:
---
${text.slice(0, 15000)}
---

User's question: "${question}"

Please answer the question based ONLY on the document content. If the answer is not in the document, say so clearly. Be concise and professional.`;

    const answer = await askGemini(prompt);

    return Response.json({ answer, documentName: attachment.fileName });
  } catch (error: any) {
    console.error("Error in document AI Q&A:", error?.message || error);
    return Response.json({ error: "Failed to analyze document" }, { status: 500 });
  }
}
