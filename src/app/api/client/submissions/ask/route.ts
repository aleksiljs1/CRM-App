import { type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askGemini } from "@/lib/gemini";
import { PDFParse } from "pdf-parse";
import { readFile } from "node:fs/promises";
import path from "node:path";

async function extractText(filePath: string, fileName: string): Promise<string | null> {
  try {
    const fullPath = path.join(process.cwd(), "public", filePath);
    const buffer = await readFile(fullPath);
    const ext = path.extname(fileName).toLowerCase();

    if (ext === ".pdf") {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      return result.pages.map((p: any) => p.text).join("\n");
    }

    if ([".txt", ".csv", ".json", ".xml"].includes(ext)) {
      return buffer.toString("utf-8");
    }

    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "CLIENT") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { submissionId, requiredDocumentId, question, history = [] } = body as {
      submissionId: string;
      requiredDocumentId: string;
      question: string;
      history: { role: "user" | "assistant"; content: string }[];
    };

    if (!submissionId || !requiredDocumentId || !question) {
      return Response.json(
        { error: "submissionId, requiredDocumentId, and question are required" },
        { status: 400 }
      );
    }

    // Verify the client owns this submission
    const client = await prisma.client.findFirst({
      where: { contactEmail: session.user.email },
    });

    if (!client) {
      return Response.json(
        { error: "Client profile not found" },
        { status: 404 }
      );
    }

    const submission = await prisma.clientSubmission.findFirst({
      where: {
        id: submissionId,
        clientId: client.id,
      },
      include: {
        processType: true,
        documents: true,
      },
    });

    if (!submission) {
      return Response.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Find the required document
    const requiredDoc = await prisma.requiredDocument.findUnique({
      where: { id: requiredDocumentId },
    });

    if (!requiredDoc) {
      return Response.json(
        { error: "Required document not found" },
        { status: 404 }
      );
    }

    // Find if there's a matching uploaded file (by aiMatchedToId or best guess)
    let uploadedFile = submission.documents.find(
      (d) => d.aiMatchedToId === requiredDocumentId
    );

    // If no AI match, try filename similarity
    if (!uploadedFile) {
      const reqNameLower = requiredDoc.documentName.toLowerCase();
      uploadedFile = submission.documents.find((d) => {
        const fName = d.fileName.toLowerCase().replace(/\.[^.]+$/, "");
        return (
          fName.includes(reqNameLower.split(" ")[0]) ||
          reqNameLower.includes(fName.split(/[_\- ]/)[0])
        );
      });
    }

    let uploadedFileText: string | null = null;
    if (uploadedFile) {
      uploadedFileText = await extractText(uploadedFile.filePath, uploadedFile.fileName);
    }

    const processType = submission.processType;

    const conversationHistory = history
      .map((h) => `${h.role === "user" ? "Client" : "Assistant"}: ${h.content}`)
      .join("\n");

    const prompt = `You are a helpful document assistant for Kreston Albania's client portal.

The client is working on the process: "${processType.name}"

They are asking about this required document:
- Document: "${requiredDoc.documentName}"
- Description: "${requiredDoc.description || "No description provided"}"
- Mandatory: ${requiredDoc.isMandatory ? "Yes" : "No"}

${
  uploadedFile && uploadedFileText
    ? `The client has uploaded a file "${uploadedFile.fileName}" for this requirement. Here is the content:\n---\n${uploadedFileText.slice(0, 10000)}\n---`
    : uploadedFile
    ? `The client has uploaded a file "${uploadedFile.fileName}" for this requirement, but the content could not be extracted (it may be an image or scanned document).`
    : "The client has NOT uploaded a document for this requirement yet."
}

${conversationHistory ? `Previous conversation:\n${conversationHistory}\n` : ""}
Client's question: "${question}"

Answer helpfully. Explain what this document is, what it should contain, how to obtain it, and any specific requirements for Albanian law/processes. If they uploaded a file, comment on whether it looks correct.
Be friendly, professional, and specific to Albanian legal/business context.
Keep answers concise but thorough.

IMPORTANT: Do NOT use markdown formatting like **, *, #, or bullet points with *. Use plain text only. Use numbered lists (1. 2. 3.) or dashes (-) for lists. No bold, no italic, no headers. The output is displayed as plain text.`;

    const answer = await askGemini(prompt);

    return Response.json({ answer });
  } catch (error) {
    console.error("Error asking AI:", error);
    return Response.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}
