import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding Audit department data...");

  const auditManager = await prisma.user.findUnique({ where: { email: "audit.manager@kreston.al" } });
  const auditSenior = await prisma.user.findUnique({ where: { email: "audit.senior@kreston.al" } });
  const auditAssociate = await prisma.user.findUnique({ where: { email: "audit.associate@kreston.al" } });
  const auditJunior = await prisma.user.findUnique({ where: { email: "audit.junior@kreston.al" } });

  if (!auditManager || !auditSenior || !auditAssociate || !auditJunior) {
    console.error("Missing audit users. Run main seed first.");
    process.exit(1);
  }

  // ── Clients for Audit ──
  const auditClients = [
    {
      id: "seed-audit-client-1",
      companyName: "Tirana Construction Group Sh.a.",
      contactName: "Agron Mema",
      contactEmail: "agron@tiranaconstruction.al",
      phone: "+355 69 700 1122",
      industry: "Construction",
      status: "ACTIVE" as const,
    },
    {
      id: "seed-audit-client-2",
      companyName: "Adriatic Shipping Sh.p.k.",
      contactName: "Brunilda Leka",
      contactEmail: "brunilda@adriaticshipping.al",
      phone: "+355 68 800 2233",
      industry: "Logistics",
      status: "ACTIVE" as const,
    },
    {
      id: "seed-audit-client-3",
      companyName: "Shkodra Textiles Sh.a.",
      contactName: "Dritëro Kola",
      contactEmail: "dritero@shkodratextiles.al",
      phone: "+355 67 900 3344",
      industry: "Manufacturing",
      status: "ACTIVE" as const,
    },
  ];

  for (const c of auditClients) {
    await prisma.client.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c, assignedToId: auditManager.id },
    });
  }
  console.log("  Created 3 audit clients");

  // ── Audit Process: Annual Financial Audit ──
  const auditProcess = await prisma.processType.upsert({
    where: { id: "seed-process-annual-audit" },
    update: {},
    create: {
      id: "seed-process-annual-audit",
      name: "Annual Financial Audit (IFRS)",
      department: "AUDIT",
      description: "Full statutory audit of financial statements per ISA and Albanian Auditing Standards",
      createdById: auditManager.id,
    },
  });

  // Delete existing docs and recreate
  await prisma.requiredDocument.deleteMany({ where: { processTypeId: auditProcess.id } });

  const auditDocs = [
    // CLIENT docs
    { name: "Annual Financial Statements", desc: "Balance Sheet, P&L, Cash Flow, Changes in Equity, and Notes", source: "CLIENT" },
    { name: "Trial Balance", desc: "Detailed trial balance as at year-end", source: "CLIENT" },
    { name: "Bank Statements & Reconciliations", desc: "All bank accounts for the full year plus year-end reconciliations", source: "CLIENT" },
    { name: "Fixed Asset Register", desc: "Complete listing with costs, depreciation, and net book values", source: "CLIENT" },
    { name: "Accounts Receivable Aging", desc: "Aged AR listing at year-end (30/60/90/120+ days)", source: "CLIENT" },
    { name: "Tax Returns & Declarations", desc: "VAT, CIT, PIT withholdings, Social Insurance for the year", source: "CLIENT" },
    { name: "Board Minutes", desc: "Minutes of Board meetings and General Assembly resolutions", source: "CLIENT" },
    { name: "Previous Year Audit Report", desc: "Prior year auditor report for comparative purposes", source: "CLIENT" },
    // INTERNAL docs
    { name: "Audit Planning Memorandum", desc: "Audit plan with materiality, risk assessment, strategy, and team assignments per ISA 300", source: "INTERNAL" },
    { name: "Risk Assessment Documentation", desc: "Risks of material misstatement at assertion level per ISA 315/240", source: "INTERNAL" },
    { name: "Audit Working Papers", desc: "Complete working papers documenting all procedures and evidence", source: "INTERNAL" },
    { name: "Bank Confirmation Letters", desc: "Direct confirmations sent to banks verifying balances and loans", source: "INTERNAL" },
    { name: "Management Representation Letter", desc: "Formal representations from management per ISA 580", source: "INTERNAL" },
    { name: "Draft Audit Report", desc: "Independent auditor's report with opinion and key audit matters", source: "INTERNAL" },
    { name: "Management Letter", desc: "Internal control deficiencies and recommendations for improvement", source: "INTERNAL" },
  ];

  for (const d of auditDocs) {
    await prisma.requiredDocument.create({
      data: {
        processTypeId: auditProcess.id,
        documentName: d.name,
        description: d.desc,
        source: d.source,
        isMandatory: true,
      },
    });
  }
  console.log("  Created audit process with 15 required documents");

  // ── Create submissions for audit clients ──
  for (const c of auditClients) {
    await prisma.clientSubmission.upsert({
      where: { id: `seed-sub-${c.id}` },
      update: {},
      create: {
        id: `seed-sub-${c.id}`,
        clientId: c.id,
        processTypeId: auditProcess.id,
        status: "INCOMPLETE",
      },
    });
  }
  console.log("  Created 3 client submissions for audit process");

  // ── Emails for Audit ──
  await prisma.email.createMany({
    data: [
      {
        threadId: "thread-audit-001",
        senderEmail: "agron@tiranaconstruction.al",
        senderName: "Agron Mema",
        recipientDept: "AUDIT",
        subject: "Financial statements ready for audit - Tirana Construction",
        body: "Dear audit team, our 2025 financial statements are ready for your review. The trial balance and bank reconciliations are attached. Please confirm when you can start the fieldwork.",
        isIncoming: true,
        isRead: false,
        isReplied: false,
        clientId: "seed-audit-client-1",
      },
      {
        threadId: "thread-audit-002",
        senderEmail: "brunilda@adriaticshipping.al",
        senderName: "Brunilda Leka",
        recipientDept: "AUDIT",
        subject: "Urgent - Discrepancy in fixed asset register",
        body: "Hello, we found a discrepancy between our fixed asset register and the general ledger. The difference is approximately 2.5 million ALL. Can you advise on how to handle this before the audit?",
        isIncoming: true,
        isRead: false,
        isReplied: false,
        clientId: "seed-audit-client-2",
      },
      {
        threadId: "thread-audit-003",
        senderEmail: "dritero@shkodratextiles.al",
        senderName: "Dritëro Kola",
        recipientDept: "AUDIT",
        subject: "Request for audit timeline - Shkodra Textiles",
        body: "Good morning, we need to schedule the audit fieldwork for Shkodra Textiles. Our board meeting is on June 30th and they need the audit report by then. Can you provide a timeline?",
        isIncoming: true,
        isRead: false,
        isReplied: false,
        clientId: "seed-audit-client-3",
      },
    ],
  });
  console.log("  Created 3 audit emails");

  // ── Tasks for Audit ──
  const now = new Date();
  const tasks = [
    // Tirana Construction - active engagement
    { title: "Audit Planning - Tirana Construction Group", desc: "Prepare audit planning memorandum including materiality calculation, risk assessment, and team assignments for FY2025 audit.", status: "COMPLETED" as const, priority: "HIGH" as const, assignee: auditSenior.id, client: "seed-audit-client-1", deadline: -5, completed: -2 },
    { title: "Send Bank Confirmation Letters - Tirana Construction", desc: "Prepare and send bank confirmation requests to BKT, Raiffeisen, and Intesa Sanpaolo for all accounts.", status: "COMPLETED" as const, priority: "HIGH" as const, assignee: auditAssociate.id, client: "seed-audit-client-1", deadline: -3, completed: -1 },
    { title: "Test Revenue Recognition - Tirana Construction", desc: "Perform substantive testing on construction contract revenue. Verify percentage-of-completion calculations and compare to invoiced amounts.", status: "IN_PROGRESS" as const, priority: "HIGH" as const, assignee: auditSenior.id, client: "seed-audit-client-1", deadline: 5 },
    { title: "Fixed Asset Verification - Tirana Construction", desc: "Physical verification of major fixed assets. Compare register to physical count. Test additions and disposals.", status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, assignee: auditJunior.id, client: "seed-audit-client-1", deadline: 7 },
    { title: "Accounts Receivable Confirmations - Tirana Construction", desc: "Send AR confirmations to top 20 debtors. Follow up on non-responses. Perform alternative procedures as needed.", status: "TODO" as const, priority: "MEDIUM" as const, assignee: auditAssociate.id, client: "seed-audit-client-1", deadline: 10 },

    // Adriatic Shipping - early stage
    { title: "Engagement Letter - Adriatic Shipping", desc: "Draft and send audit engagement letter for FY2025. Include scope, fees, timeline, and management responsibilities.", status: "COMPLETED" as const, priority: "MEDIUM" as const, assignee: auditSenior.id, client: "seed-audit-client-2", deadline: -10, completed: -8 },
    { title: "Preliminary Risk Assessment - Adriatic Shipping", desc: "Perform preliminary risk assessment. Identify areas of significant risk including foreign currency transactions and vessel valuations.", status: "REVIEW" as const, priority: "HIGH" as const, assignee: auditAssociate.id, client: "seed-audit-client-2", deadline: 3 },
    { title: "Fixed Asset Discrepancy Investigation", desc: "Investigate the 2.5M ALL discrepancy between fixed asset register and GL reported by client. Determine root cause.", status: "TODO" as const, priority: "URGENT" as const, assignee: auditSenior.id, client: "seed-audit-client-2", deadline: 2 },

    // Shkodra Textiles - planning phase
    { title: "Audit Timeline Proposal - Shkodra Textiles", desc: "Prepare audit timeline considering June 30 board meeting deadline. Include planning, fieldwork, and reporting phases.", status: "IN_PROGRESS" as const, priority: "HIGH" as const, assignee: auditAssociate.id, client: "seed-audit-client-3", deadline: 4 },
    { title: "Industry Research - Textile Manufacturing", desc: "Research Albanian textile industry trends, regulatory changes, and common audit issues for context in the Shkodra Textiles engagement.", status: "COMPLETED" as const, priority: "LOW" as const, assignee: auditJunior.id, client: "seed-audit-client-3", deadline: -2, completed: -1 },
    { title: "Prior Year Working Papers Review", desc: "Review prior year audit working papers for Shkodra Textiles to identify recurring issues and carryforward items.", status: "TODO" as const, priority: "MEDIUM" as const, assignee: auditJunior.id, client: "seed-audit-client-3", deadline: 8 },

    // General audit tasks
    { title: "Monthly CPD Training - ISA 540 Estimates", desc: "Complete mandatory continuing professional development training on ISA 540 Revised - Auditing Accounting Estimates.", status: "TODO" as const, priority: "LOW" as const, assignee: auditJunior.id, client: null, deadline: 14 },
    { title: "Quarterly Quality Control Review", desc: "Perform ISQM 1 quality control review of completed audit files. Select 2 engagements for review.", status: "TODO" as const, priority: "MEDIUM" as const, assignee: auditSenior.id, client: null, deadline: 21 },
  ];

  for (const t of tasks) {
    const deadlineDate = new Date(now.getTime() + t.deadline * 86400000);
    const completedAt = t.completed ? new Date(now.getTime() + t.completed * 86400000) : null;

    const task = await prisma.task.create({
      data: {
        title: t.title,
        description: t.desc,
        status: t.status,
        priority: t.priority,
        department: "AUDIT",
        assignedToId: t.assignee,
        createdById: auditManager.id,
        clientId: t.client,
        processTypeId: t.client ? auditProcess.id : null,
        deadline: deadlineDate,
        completedAt,
      },
    });

    // Create status history
    const statusFlow: string[] = [];
    if (t.status === "COMPLETED") statusFlow.push("TODO", "IN_PROGRESS", "REVIEW", "APPROVED", "COMPLETED");
    else if (t.status === "REVIEW") statusFlow.push("TODO", "IN_PROGRESS", "REVIEW");
    else if (t.status === "IN_PROGRESS") statusFlow.push("TODO", "IN_PROGRESS");
    else statusFlow.push("TODO");

    let prevStatus: string | null = null;
    for (let i = 0; i < statusFlow.length; i++) {
      const hoursAgo = (statusFlow.length - i) * 24;
      await prisma.taskStatusHistory.create({
        data: {
          taskId: task.id,
          fromStatus: prevStatus,
          toStatus: statusFlow[i],
          changedById: i === 0 ? auditManager.id : t.assignee,
          changedAt: new Date(now.getTime() - hoursAgo * 3600000),
        },
      });
      prevStatus = statusFlow[i];
    }
  }
  console.log("  Created 13 audit tasks with full status history");

  console.log("\nAudit seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
