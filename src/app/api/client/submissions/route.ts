import { type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { askGemini } from "@/lib/gemini";

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

    // Create SubmittedDocument records
    await prisma.submittedDocument.createMany({
      data: savedDocs.map((doc) => ({
        submissionId: submission!.id,
        fileName: doc.fileName,
        filePath: doc.filePath,
        fileSize: doc.fileSize,
      })),
    });

    // AI validation: compare uploaded file names against required CLIENT documents
    const requiredDocNames = processType.requiredDocuments.map(
      (d) => d.documentName
    );
    const uploadedFileNames = [
      ...savedDocs.map((d) => d.fileName),
    ];

    // Also get previously uploaded docs for this submission
    const allDocs = await prisma.submittedDocument.findMany({
      where: { submissionId: submission.id },
      select: { fileName: true },
    });
    const allUploadedNames = allDocs.map((d) => d.fileName);

    let validation = {
      complete: false,
      missing: requiredDocNames,
      matched: [] as string[],
    };

    try {
      const prompt = `You are a legal document validator. Compare the uploaded document file names against the required documents for a "${processType.name}" process.

Required CLIENT documents:
${requiredDocNames.map((n, i) => `${i + 1}. ${n}`).join("\n")}

Uploaded file names:
${allUploadedNames.map((n, i) => `${i + 1}. ${n}`).join("\n")}

For each required document, determine if any uploaded file likely matches it (by name similarity or content type inference).

Respond ONLY with valid JSON in this exact format:
{
  "complete": true/false,
  "matched": ["list of required doc names that have a matching upload"],
  "missing": ["list of required doc names that are NOT yet uploaded"]
}`;

      const aiResponse = await askGemini(prompt);
      const cleaned = aiResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      validation = {
        complete: parsed.complete ?? false,
        matched: parsed.matched ?? [],
        missing: parsed.missing ?? requiredDocNames,
      };
    } catch {
      // If AI fails, do basic matching
      const matchedNames: string[] = [];
      const missingNames: string[] = [];
      for (const reqName of requiredDocNames) {
        const found = allUploadedNames.some(
          (u) =>
            u.toLowerCase().includes(reqName.toLowerCase().split(" ")[0]) ||
            reqName.toLowerCase().includes(u.toLowerCase().split(".")[0])
        );
        if (found) {
          matchedNames.push(reqName);
        } else {
          missingNames.push(reqName);
        }
      }
      validation = {
        complete: missingNames.length === 0,
        matched: matchedNames,
        missing: missingNames,
      };
    }

    // Update submission status based on validation
    const newStatus = validation.complete ? "COMPLETE" : "INCOMPLETE";
    await prisma.clientSubmission.update({
      where: { id: submission.id },
      data: {
        status: newStatus,
        aiValidation: validation,
      },
    });

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
