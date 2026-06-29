import { type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { askGemini } from "@/lib/gemini";
import { createNotification } from "@/lib/notify";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await prisma.client.findFirst({
      where: { contactEmail: session.user.email },
    });

    if (!client) {
      return Response.json({ submissions: [] });
    }

    const submissions = await prisma.clientSubmission.findMany({
      where: { clientId: client.id },
      include: {
        processType: {
          include: {
            requiredDocuments: {
              where: { source: "CLIENT" },
            },
          },
        },
        documents: {
          include: {
            aiMatchedTo: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return Response.json({ submissions });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return Response.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await prisma.client.findFirst({
      where: { contactEmail: session.user.email },
    });

    if (!client) {
      return Response.json(
        { error: "Client profile not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const processTypeId = formData.get("processTypeId") as string | null;

    if (!processTypeId) {
      return Response.json(
        { error: "processTypeId is required" },
        { status: 400 }
      );
    }

    // Verify the process type exists
    const processType = await prisma.processType.findUnique({
      where: { id: processTypeId },
      include: {
        requiredDocuments: {
          where: { source: "CLIENT" },
        },
      },
    });

    if (!processType) {
      return Response.json(
        { error: "Process type not found" },
        { status: 404 }
      );
    }

    const files = formData.getAll("files") as File[];
    if (files.length === 0) {
      return Response.json(
        { error: "At least one file is required" },
        { status: 400 }
      );
    }

    // Find or create a submission
    let submission = await prisma.clientSubmission.findFirst({
      where: {
        clientId: client.id,
        processTypeId,
        status: { in: ["INCOMPLETE", "UNDER_REVIEW"] },
      },
    });

    if (!submission) {
      submission = await prisma.clientSubmission.create({
        data: {
          clientId: client.id,
          processTypeId,
          status: "INCOMPLETE",
        },
      });
    }

    // Save files
    const savedDocs: { fileName: string; filePath: string; fileSize: number }[] = [];
    for (const file of files) {
      const ext = path.extname(file.name);
      const uniqueName = `${crypto.randomUUID()}${ext}`;
      const fullPath = path.join(process.cwd(), "public", "documents", uniqueName);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(fullPath, buffer);
      savedDocs.push({
        fileName: file.name,
        filePath: `/documents/${uniqueName}`,
        fileSize: buffer.length,
      });
    }

    // Build file info with first-page text for AI matching
    const fileInfoForAI: { fileName: string; filePath: string; fileSize: number; firstPageText: string }[] = [];
    for (const doc of savedDocs) {
      let firstPageText = "";
      try {
        const fullPath = path.join(process.cwd(), "public", doc.filePath);
        const buffer = await import("node:fs/promises").then(fs => fs.readFile(fullPath));
        if (doc.fileName.toLowerCase().endsWith(".pdf")) {
          const { PDFParse } = await import("pdf-parse");
          const pdf = new PDFParse({ data: new Uint8Array(buffer) });
          const result = await pdf.getText();
          firstPageText = ((result as any).pages?.[0]?.text || "").slice(0, 500);
          pdf.destroy();
        } else {
          firstPageText = buffer.toString("utf-8").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
        }
      } catch {
        firstPageText = "";
      }
      fileInfoForAI.push({ ...doc, firstPageText });
    }

    // AI matching: ask AI to assign each uploaded file to a required document
    const requiredDocs = processType.requiredDocuments;
    const requiredDocNames = requiredDocs.map(d => d.documentName);

    // Get previously uploaded docs
    const previousDocs = await prisma.submittedDocument.findMany({
      where: { submissionId: submission.id },
      select: { fileName: true, aiMatchedToId: true },
    });

    let matchResults: { fileName: string; matchedRequiredDocId: string | null; confidence: number }[] = [];

    try {
      const prompt = `You are a legal document classifier for a "${processType.name}" process at Kreston Albania.

Required CLIENT documents (with IDs):
${requiredDocs.map(d => `- ID: "${d.id}" | Name: "${d.documentName}" | Description: "${d.description || ""}"`).join("\n")}

Newly uploaded files:
${fileInfoForAI.map(f => `- File: "${f.fileName}"${f.firstPageText ? ` | Content preview: "${f.firstPageText}"` : ""}`).join("\n")}

Previously uploaded files already matched:
${previousDocs.filter(d => d.aiMatchedToId).map(d => `- "${d.fileName}" -> matched to ${d.aiMatchedToId}`).join("\n") || "None"}

For each NEWLY uploaded file, decide which required document it best matches. Use the filename AND content preview to decide. If a required document is already matched by a previous upload, the new file can still match it (as an update/replacement).

Return ONLY a JSON array:
[{"fileName": "exact_filename.pdf", "matchedRequiredDocId": "the_id_or_null", "confidence": 0.95}]`;

      const aiResponse = await askGemini(prompt);
      const cleaned = aiResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      matchResults = JSON.parse(cleaned);
    } catch {
      // Fallback: try basic name matching
      matchResults = fileInfoForAI.map(f => {
        const match = requiredDocs.find(d =>
          f.fileName.toLowerCase().includes(d.documentName.toLowerCase().split(" ")[0].toLowerCase()) ||
          d.documentName.toLowerCase().includes(f.fileName.toLowerCase().split(".")[0])
        );
        return { fileName: f.fileName, matchedRequiredDocId: match?.id || null, confidence: match ? 0.6 : 0 };
      });
    }

    // Create SubmittedDocument records with AI matching
    for (const doc of fileInfoForAI) {
      const match = matchResults.find(m => m.fileName === doc.fileName);
      await prisma.submittedDocument.create({
        data: {
          submissionId: submission!.id,
          fileName: doc.fileName,
          filePath: doc.filePath,
          fileSize: doc.fileSize,
          firstPageText: doc.firstPageText || null,
          aiMatchedToId: match?.matchedRequiredDocId || null,
          aiConfidence: match?.confidence || null,
        },
      });
    }

    // Recalculate validation status
    const allSubmittedDocs = await prisma.submittedDocument.findMany({
      where: { submissionId: submission.id },
    });
    const matchedRequiredIds = new Set(allSubmittedDocs.filter(d => d.aiMatchedToId).map(d => d.aiMatchedToId));
    const matched = requiredDocs.filter(d => matchedRequiredIds.has(d.id)).map(d => d.documentName);
    const missing = requiredDocs.filter(d => !matchedRequiredIds.has(d.id)).map(d => d.documentName);
    const complete = missing.length === 0;

    const validation = { complete, matched, missing };

    // Update submission status
    await prisma.clientSubmission.update({
      where: { id: submission.id },
      data: {
        status: complete ? "COMPLETE" : "INCOMPLETE",
        aiValidation: validation,
      },
    });

    // Notify team members working on this process
    const clientName = client.companyName || client.contactName;
    const matchedDocNames = matched.join(", ");
    const notifMessage = complete
      ? `${clientName} has submitted all required documents for "${processType.name}". Ready for processing.`
      : `${clientName} uploaded documents for "${processType.name}" (${matched.length}/${requiredDocs.length} matched: ${matchedDocNames}). Missing: ${missing.join(", ")}`;

    // Find tasks linked to this process to get assigned employees
    const linkedTasks = await prisma.task.findMany({
      where: { processTypeId },
      select: { assignedToId: true, createdById: true },
    });
    const userIdsToNotify = new Set<string>();
    for (const t of linkedTasks) {
      if (t.assignedToId) userIdsToNotify.add(t.assignedToId);
      if (t.createdById) userIdsToNotify.add(t.createdById);
    }

    // Also notify the department manager
    const deptManager = await prisma.user.findFirst({
      where: { department: processType.department as any, role: "MANAGER", isActive: true },
      select: { id: true },
    });
    if (deptManager) userIdsToNotify.add(deptManager.id);

    // Send notifications via Socket.io
    for (const userId of userIdsToNotify) {
      await createNotification({
        userId,
        title: complete ? "Client Documents Complete" : "Client Uploaded Documents",
        message: notifMessage,
        type: "DOCUMENT",
        link: "/dashboard/workspace/submissions",
      });
    }

    // Refetch for response
    const updatedSubmission = await prisma.clientSubmission.findUnique({
      where: { id: submission.id },
      include: {
        processType: {
          include: { requiredDocuments: { where: { source: "CLIENT" } } },
        },
        documents: true,
      },
    });

    return Response.json(
      { submission: updatedSubmission, validation },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating submission:", error);
    return Response.json(
      { error: "Failed to create submission" },
      { status: 500 }
    );
  }
}
