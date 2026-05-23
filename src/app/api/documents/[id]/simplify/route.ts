import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askGemini } from "@/lib/gemini";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";

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
      const pdf = new PDFParse(new Uint8Array(buffer));
      await pdf.load();
      const result = await pdf.getText();
      const text = (result as any).pages?.map((p: any) => p.text || "").join("\n") || "";
      pdf.destroy();
      console.log("[DOC-SIMPLIFY] PDF extracted, text length:", text.length);
      if (text.length > 0) return text;
      return buffer.toString("utf-8").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    } catch (err) {
      console.error("[DOC-SIMPLIFY] PDF parse error:", err);
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

A user wants a simplified summary of this document so they can quickly understand what it says.

Document name: ${attachment.fileName}
Document type: ${attachment.mimeType}
Document content:
---
${text.slice(0, 15000)}
---

Please provide:
1. **What this document is**: A one-sentence description
2. **Key points**: The 3-5 most important things in this document, as bullet points
3. **Important dates/deadlines**: Any dates mentioned
4. **Action items**: What needs to be done based on this document
5. **Summary**: A 2-3 sentence plain-language summary

Use simple, clear language. Avoid jargon.`;

    const summary = await askGemini(prompt);

    return Response.json({ summary, documentName: attachment.fileName });
  } catch (error: any) {
    console.error("Error in document simplify:", error?.message || error);
    return Response.json({ error: "Failed to simplify document" }, { status: 500 });
  }
}
