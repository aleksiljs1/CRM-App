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

    // For text-based files, try reading as UTF-8
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
    const { submissionId } = body;

    if (!submissionId) {
      return Response.json(
        { error: "submissionId is required" },
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
        processType: {
          include: {
            requiredDocuments: {
              where: { source: "CLIENT" },
            },
          },
        },
        documents: true,
      },
    });

    if (!submission) {
      return Response.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const processType = submission.processType;
    const requiredDocs = processType.requiredDocuments;
    const uploadedDocs = submission.documents;

    // Extract text from uploaded documents
    const uploadedWithText = await Promise.all(
      uploadedDocs.map(async (doc) => {
        const extractedText = await extractText(doc.filePath, doc.fileName);
        return {
          fileName: doc.fileName,
          filePath: doc.filePath,
          extractedText,
        };
      })
    );

    const prompt = `You are a document verification assistant for a legal process at Kreston Albania.

Process: "${processType.name}"
Description: "${processType.description || "No description"}"

Required documents from the client:
${requiredDocs.map((d) => `- ${d.documentName}: ${d.description || "No description"} (${d.isMandatory ? "MANDATORY" : "Optional"})`).join("\n")}

Uploaded documents:
${uploadedWithText.map((d) => `- File: "${d.fileName}"${d.extractedText ? `\n  Content preview: ${d.extractedText.slice(0, 500)}` : ""}`).join("\n")}

For each required document:
1. Is there a matching upload? (match by filename AND content if readable)
2. Does the content look correct for what's required?
3. Are there any issues (wrong format, incomplete, expired)?

Return a JSON object:
{
  "overallStatus": "COMPLETE" | "INCOMPLETE" | "NEEDS_REVIEW",
  "summary": "Brief summary of document status",
  "documents": [
    {
      "requiredDocument": "document name here",
      "status": "FOUND" | "MISSING" | "NEEDS_REVIEW",
      "matchedFile": "filename.pdf or null",
      "feedback": "description of what was found or what is needed"
    }
  ],
  "suggestions": ["any additional suggestions"]
}

Respond ONLY with valid JSON, no markdown fencing.`;

    const aiResponse = await askGemini(prompt);
    const cleaned = aiResponse
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const result = JSON.parse(cleaned);

    // Store the AI validation result on the submission
    await prisma.clientSubmission.update({
      where: { id: submissionId },
      data: { aiValidation: result },
    });

    return Response.json({ result });
  } catch (error) {
    console.error("Error checking documents:", error);
    return Response.json(
      { error: "Failed to check documents" },
      { status: 500 }
    );
  }
}
