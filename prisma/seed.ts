import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const users = [
    // ── Global ──
    {
      email: "admin@kreston.al",
      name: "Elena Marku",
      password: "admin123",
      role: "ADMIN" as const,
      department: null,
    },
    {
      email: "partner@kreston.al",
      name: "Arben Dervishi",
      password: "partner123",
      role: "PARTNER" as const,
      department: null,
    },
    {
      email: "client@alpha.com",
      name: "John Alpha",
      password: "client123",
      role: "CLIENT" as const,
      department: null,
    },

    // ── HR Department ──
    {
      email: "hr.manager@kreston.al",
      name: "Besa Hoxha",
      password: "hr123",
      role: "MANAGER" as const,
      department: "HR" as const,
    },
    {
      email: "hr.senior@kreston.al",
      name: "Dritan Kelmendi",
      password: "hr123",
      role: "SENIOR" as const,
      subRole: "Senior HR Specialist",
      department: "HR" as const,
    },
    {
      email: "hr.associate@kreston.al",
      name: "Elira Basha",
      password: "hr123",
      role: "ASSOCIATE" as const,
      subRole: "Senior Associate",
      department: "HR" as const,
    },
    {
      email: "hr.junior@kreston.al",
      name: "Fjolla Gashi",
      password: "hr123",
      role: "JUNIOR" as const,
      subRole: "Junior HR Coordinator",
      department: "HR" as const,
    },
    {
      email: "hr.intern@kreston.al",
      name: "Genti Shehu",
      password: "hr123",
      role: "INTERN" as const,
      department: "HR" as const,
    },

    // ── Audit Department ──
    {
      email: "audit.manager@kreston.al",
      name: "Ilir Brahimi",
      password: "audit123",
      role: "MANAGER" as const,
      department: "AUDIT" as const,
    },
    {
      email: "audit.senior@kreston.al",
      name: "Jeta Rexhepi",
      password: "audit123",
      role: "SENIOR" as const,
      subRole: "Senior Auditor",
      department: "AUDIT" as const,
    },
    {
      email: "audit.associate@kreston.al",
      name: "Klea Murati",
      password: "audit123",
      role: "ASSOCIATE" as const,
      subRole: "Audit Associate",
      department: "AUDIT" as const,
    },
    {
      email: "audit.junior@kreston.al",
      name: "Luan Berisha",
      password: "audit123",
      role: "JUNIOR" as const,
      subRole: "Junior Auditor",
      department: "AUDIT" as const,
    },

    // ── Legal Department ──
    {
      email: "legal.manager@kreston.al",
      name: "Mira Topalli",
      password: "legal123",
      role: "MANAGER" as const,
      department: "LEGAL" as const,
    },
    {
      email: "legal.senior@kreston.al",
      name: "Niko Çela",
      password: "legal123",
      role: "SENIOR" as const,
      subRole: "Senior Legal Counsel",
      department: "LEGAL" as const,
    },
    {
      email: "legal.associate@kreston.al",
      name: "Ornela Kapllani",
      password: "legal123",
      role: "ASSOCIATE" as const,
      subRole: "Junior Associate",
      department: "LEGAL" as const,
    },
    {
      email: "legal.junior@kreston.al",
      name: "Petrit Lika",
      password: "legal123",
      role: "JUNIOR" as const,
      subRole: "Legal Intern",
      department: "LEGAL" as const,
    },

    // ── Accounting & Tax Department ──
    {
      email: "tax.manager@kreston.al",
      name: "Qemal Zorba",
      password: "tax123",
      role: "MANAGER" as const,
      department: "ACCOUNTING_TAX" as const,
    },
    {
      email: "tax.senior@kreston.al",
      name: "Rina Hyseni",
      password: "tax123",
      role: "SENIOR" as const,
      subRole: "Senior Tax Advisor",
      department: "ACCOUNTING_TAX" as const,
    },
    {
      email: "tax.associate@kreston.al",
      name: "Sokol Duka",
      password: "tax123",
      role: "ASSOCIATE" as const,
      subRole: "Tax Associate",
      department: "ACCOUNTING_TAX" as const,
    },
    {
      email: "tax.junior@kreston.al",
      name: "Teuta Vata",
      password: "tax123",
      role: "JUNIOR" as const,
      subRole: "Junior Accountant",
      department: "ACCOUNTING_TAX" as const,
    },

    // ── Bookkeeping & Payroll Department ──
    {
      email: "payroll.manager@kreston.al",
      name: "Uran Krasniqi",
      password: "payroll123",
      role: "MANAGER" as const,
      department: "BOOKKEEPING_PAYROLL" as const,
    },
    {
      email: "payroll.senior@kreston.al",
      name: "Vjosa Malaj",
      password: "payroll123",
      role: "SENIOR" as const,
      subRole: "Senior Payroll Specialist",
      department: "BOOKKEEPING_PAYROLL" as const,
    },
    {
      email: "payroll.associate@kreston.al",
      name: "Xheni Daci",
      password: "payroll123",
      role: "ASSOCIATE" as const,
      subRole: "Bookkeeping Associate",
      department: "BOOKKEEPING_PAYROLL" as const,
    },
    {
      email: "payroll.junior@kreston.al",
      name: "Ylber Tafa",
      password: "payroll123",
      role: "JUNIOR" as const,
      subRole: "Junior Bookkeeper",
      department: "BOOKKEEPING_PAYROLL" as const,
    },

    // ── Advisory Department ──
    {
      email: "advisory.manager@kreston.al",
      name: "Zana Përgjoka",
      password: "advisory123",
      role: "MANAGER" as const,
      department: "ADVISORY" as const,
    },
    {
      email: "advisory.senior@kreston.al",
      name: "Ardi Canaj",
      password: "advisory123",
      role: "SENIOR" as const,
      subRole: "Senior Business Consultant",
      department: "ADVISORY" as const,
    },
    {
      email: "advisory.associate@kreston.al",
      name: "Blerina Shala",
      password: "advisory123",
      role: "ASSOCIATE" as const,
      subRole: "Advisory Associate",
      department: "ADVISORY" as const,
    },
    {
      email: "advisory.junior@kreston.al",
      name: "Çelik Hoti",
      password: "advisory123",
      role: "JUNIOR" as const,
      subRole: "Junior Analyst",
      department: "ADVISORY" as const,
    },

    // ── Marketing Department ──
    {
      email: "marketing.manager@kreston.al",
      name: "Dafina Osmani",
      password: "marketing123",
      role: "MANAGER" as const,
      department: "MARKETING" as const,
    },
    {
      email: "marketing.associate@kreston.al",
      name: "Ermal Peci",
      password: "marketing123",
      role: "ASSOCIATE" as const,
      subRole: "Digital Marketing Specialist",
      department: "MARKETING" as const,
    },

    // ── Finance (Internal) Department ──
    {
      email: "finance.manager@kreston.al",
      name: "Flora Thaçi",
      password: "finance123",
      role: "MANAGER" as const,
      department: "FINANCE" as const,
    },
    {
      email: "finance.senior@kreston.al",
      name: "Gëzim Rama",
      password: "finance123",
      role: "SENIOR" as const,
      subRole: "Senior Financial Analyst",
      department: "FINANCE" as const,
    },
    {
      email: "finance.associate@kreston.al",
      name: "Hana Koci",
      password: "finance123",
      role: "ASSOCIATE" as const,
      subRole: "Finance Associate",
      department: "FINANCE" as const,
    },
  ];

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    await prisma.user.upsert({
      where: { email: userData.email },
      update: { subRole: (userData as any).subRole ?? null },
      create: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: userData.role,
        subRole: (userData as any).subRole ?? null,
        department: userData.department,
      },
    });

    console.log(`  Created/updated user: ${userData.email}`);
  }

  // Seed a sample client company
  const hrManager = await prisma.user.findUnique({ where: { email: "hr.manager@kreston.al" } });

  if (hrManager) {
    await prisma.client.upsert({
      where: { id: "seed-client-alpha" },
      update: {},
      create: {
        id: "seed-client-alpha",
        companyName: "Alpha Corp",
        contactName: "John Alpha",
        contactEmail: "client@alpha.com",
        phone: "+355 69 123 4567",
        industry: "Technology",
        status: "ACTIVE",
        assignedToId: hrManager.id,
      },
    });
    console.log("  Created client: Alpha Corp");

    // Seed a sample process type with required documents
    const processType = await prisma.processType.upsert({
      where: { id: "seed-process-audit" },
      update: {},
      create: {
        id: "seed-process-audit",
        name: "Annual Audit",
        department: "AUDIT",
        description: "Full annual audit engagement",
        createdById: hrManager.id,
      },
    });

    const requiredDocs = [
      { name: "Financial Statements (Balance Sheet, P&L)", description: "Annual financial statements" },
      { name: "Trial Balance", description: "Trial balance for the audit period" },
      { name: "Bank Reconciliation Statements", description: "Bank reconciliation for all accounts" },
      { name: "Board Resolution", description: "Board resolution authorizing the audit" },
      { name: "Previous Year Audit Report", description: "Prior year audit report for reference" },
      { name: "Tax Compliance Certificate", description: "Certificate from tax authority" },
    ];

    // Delete existing required documents to avoid duplication on re-seed
    await prisma.requiredDocument.deleteMany({ where: { processTypeId: processType.id } });

    for (const doc of requiredDocs) {
      await prisma.requiredDocument.create({
        data: {
          processTypeId: processType.id,
          documentName: doc.name,
          description: doc.description,
          isMandatory: true,
        },
      });
    }
    console.log("  Created process type: Annual Audit with 6 required documents");

    // Seed sample emails for HR
    // Delete existing seed emails to avoid duplication on re-seed
    await prisma.email.deleteMany({ where: { threadId: { in: ["thread-001", "thread-002", "thread-003"] } } });

    // Thread 1: standalone email
    await prisma.email.create({
      data: {
        threadId: "thread-001",
        senderEmail: "client@alpha.com",
        senderName: "John Alpha",
        recipientDept: "HR",
        subject: "Urgent - Payroll correction needed for March",
        body: "Dear Kreston team, we noticed an error in the March payroll for employee #45. The overtime hours were not included in the final calculation. Please correct this as soon as possible.",
        isIncoming: true,
        isReplied: false,
        clientId: "seed-client-alpha",
      },
    });

    // Thread 2: create sequentially so parentId can reference the previous email
    const thread2Root = await prisma.email.create({
      data: {
        threadId: "thread-002",
        senderEmail: "hr@beta.com",
        senderName: "Beta LLC HR",
        recipientDept: "HR",
        subject: "Employee onboarding documents",
        body: "Hello, we are sending the onboarding documents for our new employee. Please find attached the employment contract and ID copy. We will send the remaining documents shortly.",
        isIncoming: true,
        isReplied: true,
        repliedAt: new Date(Date.now() - 86400000),
      },
    });

    const thread2Reply1 = await prisma.email.create({
      data: {
        threadId: "thread-002",
        parentId: thread2Root.id,
        senderEmail: "hr.manager@kreston.al",
        senderName: "HR Manager",
        recipientDept: "HR",
        subject: "Re: Employee onboarding documents",
        body: "Thank you for the documents. We still need the Tax Registration Number and Social Insurance Registration to complete the onboarding.",
        isIncoming: false,
        isReplied: true,
        userId: hrManager.id,
      },
    });

    await prisma.email.create({
      data: {
        threadId: "thread-002",
        parentId: thread2Reply1.id,
        senderEmail: "hr@beta.com",
        senderName: "Beta LLC HR",
        recipientDept: "HR",
        subject: "Re: Re: Employee onboarding documents",
        body: "Here are the remaining documents attached. Please confirm once the onboarding is complete.",
        isIncoming: true,
        isReplied: false,
      },
    });

    // Thread 3: standalone email
    await prisma.email.create({
      data: {
        threadId: "thread-003",
        senderEmail: "office@gamma.com",
        senderName: "Gamma Ltd",
        recipientDept: "HR",
        subject: "Question about payroll schedule",
        body: "Hi, could you please let us know the payroll processing schedule for Q2? We need to align our internal processes.",
        isIncoming: true,
        isReplied: false,
      },
    });
    console.log("  Created 5 sample emails across 3 threads (with parentId links)");

    // Seed document validation test data
    // First, delete any existing submission for this client+process to allow re-seed
    await prisma.clientSubmission.deleteMany({
      where: { clientId: "seed-client-alpha", processTypeId: processType.id },
    });

    const submission = await prisma.clientSubmission.create({
      data: {
        clientId: "seed-client-alpha",
        processTypeId: processType.id,
        status: "INCOMPLETE",
      },
    });

    // Fetch the required documents we just created so we can reference their IDs
    const reqDocs = await prisma.requiredDocument.findMany({
      where: { processTypeId: processType.id },
    });
    const reqDocByName = (partial: string) => reqDocs.find((d) => d.documentName.includes(partial));

    const financialStatementsDoc = reqDocByName("Financial Statements");
    const trialBalanceDoc = reqDocByName("Trial Balance");
    const bankReconDoc = reqDocByName("Bank Reconciliation");

    await prisma.submittedDocument.createMany({
      data: [
        {
          submissionId: submission.id,
          fileName: "financial_statements_2025.pdf",
          filePath: "/uploads/seed-client-alpha/financial_statements_2025.pdf",
          fileSize: 2_450_000,
          aiMatchedToId: financialStatementsDoc?.id ?? null,
          aiConfidence: 0.92,
          firstPageText: "Financial Statements for Alpha Corp - Year ended December 2025",
        },
        {
          submissionId: submission.id,
          fileName: "trial_balance_march.xlsx",
          filePath: "/uploads/seed-client-alpha/trial_balance_march.xlsx",
          fileSize: 890_000,
          aiMatchedToId: trialBalanceDoc?.id ?? null,
          aiConfidence: 0.88,
          firstPageText: null,
        },
        {
          submissionId: submission.id,
          fileName: "bank_reconciliation_Q4.pdf",
          filePath: "/uploads/seed-client-alpha/bank_reconciliation_Q4.pdf",
          fileSize: 1_200_000,
          aiMatchedToId: bankReconDoc?.id ?? null,
          aiConfidence: 0.95,
          firstPageText: null,
        },
      ],
    });
    console.log("  Created ClientSubmission (INCOMPLETE) with 3 submitted documents for Alpha Corp");
  }

  // ── Legal Department: Clients, Tasks with full lifecycle ──────────────────
  const legalManager = await prisma.user.findUnique({ where: { email: "legal.manager@kreston.al" } });
  const legalSenior = await prisma.user.findUnique({ where: { email: "legal.senior@kreston.al" } });
  const legalAssociate = await prisma.user.findUnique({ where: { email: "legal.associate@kreston.al" } });
  const legalJunior = await prisma.user.findUnique({ where: { email: "legal.junior@kreston.al" } });

  if (legalManager && legalSenior && legalAssociate && legalJunior) {
    // ── Legal Clients ──
    const legalClient1 = await prisma.client.upsert({
      where: { id: "seed-client-delta" },
      update: {},
      create: {
        id: "seed-client-delta",
        companyName: "Delta Holdings Sh.p.k.",
        contactName: "Artan Shkreli",
        contactEmail: "artan@deltaholdings.al",
        phone: "+355 69 234 5678",
        industry: "Real Estate",
        status: "ACTIVE",
        assignedToId: legalManager.id,
      },
    });

    const legalClient2 = await prisma.client.upsert({
      where: { id: "seed-client-epsilon" },
      update: {},
      create: {
        id: "seed-client-epsilon",
        companyName: "Epsilon Pharma Sh.a.",
        contactName: "Violeta Hoxha",
        contactEmail: "violeta@epsilonpharma.al",
        phone: "+355 68 345 6789",
        industry: "Healthcare",
        status: "ACTIVE",
        assignedToId: legalSenior.id,
      },
    });

    const legalClient3 = await prisma.client.upsert({
      where: { id: "seed-client-zeta" },
      update: {},
      create: {
        id: "seed-client-zeta",
        companyName: "Zeta Construction",
        contactName: "Besnik Kola",
        contactEmail: "besnik@zetaconstruction.al",
        phone: "+355 67 456 7890",
        industry: "Construction",
        status: "LEAD",
        assignedToId: legalAssociate.id,
      },
    });

    const legalClient4 = await prisma.client.upsert({
      where: { id: "seed-client-eta" },
      update: {},
      create: {
        id: "seed-client-eta",
        companyName: "Eta Retail Group",
        contactName: "Dorina Prifti",
        contactEmail: "dorina@etaretail.al",
        phone: "+355 69 567 8901",
        industry: "Retail",
        status: "ACTIVE",
        assignedToId: legalManager.id,
      },
    });

    console.log("  Created 4 legal clients");

    // ── Legal Process Type ──
    const legalProcess = await prisma.processType.upsert({
      where: { id: "seed-process-company-registration" },
      update: {},
      create: {
        id: "seed-process-company-registration",
        name: "Company Registration",
        department: "LEGAL",
        description: "Full company registration with NBS (National Business Center)",
        createdById: legalManager.id,
      },
    });

    await prisma.requiredDocument.deleteMany({ where: { processTypeId: legalProcess.id } });
    const legalReqDocs = [
      { name: "Founder ID Documents", description: "Passport or ID card of all founders" },
      { name: "Articles of Association", description: "Company charter and bylaws" },
      { name: "Capital Proof", description: "Bank statement showing initial capital deposit" },
      { name: "Business Plan", description: "Brief business plan for registration" },
    ];
    for (const doc of legalReqDocs) {
      await prisma.requiredDocument.create({
        data: { processTypeId: legalProcess.id, documentName: doc.name, description: doc.description, isMandatory: true },
      });
    }
    console.log("  Created process type: Company Registration with 4 required documents");

    // ── Helper: create task with full status history ──
    const now = Date.now();
    const DAY = 86400000;
    const HOUR = 3600000;

    async function createTaskWithHistory(opts: {
      id: string;
      title: string;
      description: string;
      priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
      status: "TODO" | "IN_PROGRESS" | "REVIEW" | "APPROVED" | "COMPLETED";
      department: "LEGAL";
      assignedToId: string;
      createdById: string;
      clientId: string | null;
      deadline: Date;
      createdAt: Date;
      transitions: { to: string; by: string; at: Date }[];
    }) {
      // Delete existing to allow re-seed
      await prisma.taskStatusHistory.deleteMany({ where: { taskId: opts.id } });
      await prisma.task.deleteMany({ where: { id: opts.id } });

      const completedAt = opts.status === "COMPLETED" ? opts.transitions[opts.transitions.length - 1]?.at : undefined;

      await prisma.task.create({
        data: {
          id: opts.id,
          title: opts.title,
          description: opts.description,
          priority: opts.priority,
          status: opts.status,
          department: opts.department,
          assignedToId: opts.assignedToId,
          createdById: opts.createdById,
          clientId: opts.clientId,
          deadline: opts.deadline,
          createdAt: opts.createdAt,
          completedAt: completedAt,
        },
      });

      for (let i = 0; i < opts.transitions.length; i++) {
        const t = opts.transitions[i];
        await prisma.taskStatusHistory.create({
          data: {
            taskId: opts.id,
            fromStatus: i === 0 ? null : opts.transitions[i - 1].to,
            toStatus: t.to,
            changedById: t.by,
            changedAt: t.at,
          },
        });
      }
    }

    // ── COMPLETED tasks (good performance data) ──

    await createTaskWithHistory({
      id: "legal-task-01",
      title: "Company Registration - Delta Holdings",
      description: "Complete NBS registration for Delta Holdings Sh.p.k. including articles of association filing and founder documentation.",
      priority: "HIGH",
      status: "COMPLETED",
      department: "LEGAL",
      assignedToId: legalAssociate.id,
      createdById: legalManager.id,
      clientId: legalClient1.id,
      deadline: new Date(now - 5 * DAY),
      createdAt: new Date(now - 14 * DAY),
      transitions: [
        { to: "TODO", by: legalManager.id, at: new Date(now - 14 * DAY) },
        { to: "IN_PROGRESS", by: legalAssociate.id, at: new Date(now - 13 * DAY) },
        { to: "REVIEW", by: legalAssociate.id, at: new Date(now - 9 * DAY) },
        { to: "APPROVED", by: legalSenior.id, at: new Date(now - 8 * DAY) },
        { to: "COMPLETED", by: legalManager.id, at: new Date(now - 7 * DAY) },
      ],
    });

    await createTaskWithHistory({
      id: "legal-task-02",
      title: "Contract Review - Epsilon Pharma Supply Agreement",
      description: "Review and revise the pharmaceutical supply agreement between Epsilon Pharma and their EU supplier. Check compliance with Albanian import regulations.",
      priority: "URGENT",
      status: "COMPLETED",
      department: "LEGAL",
      assignedToId: legalSenior.id,
      createdById: legalManager.id,
      clientId: legalClient2.id,
      deadline: new Date(now - 3 * DAY),
      createdAt: new Date(now - 10 * DAY),
      transitions: [
        { to: "TODO", by: legalManager.id, at: new Date(now - 10 * DAY) },
        { to: "IN_PROGRESS", by: legalSenior.id, at: new Date(now - 10 * DAY + 2 * HOUR) },
        { to: "REVIEW", by: legalSenior.id, at: new Date(now - 6 * DAY) },
        { to: "APPROVED", by: legalManager.id, at: new Date(now - 5 * DAY) },
        { to: "COMPLETED", by: legalManager.id, at: new Date(now - 4 * DAY) },
      ],
    });

    await createTaskWithHistory({
      id: "legal-task-03",
      title: "Employment Contracts Batch - Eta Retail",
      description: "Draft 12 employment contracts for Eta Retail Group's new hires. Include non-compete clauses and probation terms as per Albanian labor law.",
      priority: "MEDIUM",
      status: "COMPLETED",
      department: "LEGAL",
      assignedToId: legalJunior.id,
      createdById: legalManager.id,
      clientId: legalClient4.id,
      deadline: new Date(now - 1 * DAY),
      createdAt: new Date(now - 12 * DAY),
      transitions: [
        { to: "TODO", by: legalManager.id, at: new Date(now - 12 * DAY) },
        { to: "IN_PROGRESS", by: legalJunior.id, at: new Date(now - 11 * DAY) },
        { to: "REVIEW", by: legalJunior.id, at: new Date(now - 5 * DAY) },
        { to: "IN_PROGRESS", by: legalSenior.id, at: new Date(now - 4 * DAY) }, // sent back
        { to: "REVIEW", by: legalJunior.id, at: new Date(now - 3 * DAY) },
        { to: "APPROVED", by: legalSenior.id, at: new Date(now - 2 * DAY) },
        { to: "COMPLETED", by: legalManager.id, at: new Date(now - 1 * DAY) },
      ],
    });

    await createTaskWithHistory({
      id: "legal-task-04",
      title: "Trademark Registration - Epsilon Pharma",
      description: "File trademark application for Epsilon Pharma's new product line with the Albanian IP Office.",
      priority: "MEDIUM",
      status: "COMPLETED",
      department: "LEGAL",
      assignedToId: legalAssociate.id,
      createdById: legalManager.id,
      clientId: legalClient2.id,
      deadline: new Date(now - 8 * DAY),
      createdAt: new Date(now - 20 * DAY),
      transitions: [
        { to: "TODO", by: legalManager.id, at: new Date(now - 20 * DAY) },
        { to: "IN_PROGRESS", by: legalAssociate.id, at: new Date(now - 19 * DAY) },
        { to: "REVIEW", by: legalAssociate.id, at: new Date(now - 12 * DAY) },
        { to: "APPROVED", by: legalSenior.id, at: new Date(now - 11 * DAY) },
        { to: "COMPLETED", by: legalManager.id, at: new Date(now - 10 * DAY) },
      ],
    });

    // ── IN_PROGRESS tasks ──

    await createTaskWithHistory({
      id: "legal-task-05",
      title: "Due Diligence - Zeta Construction Acquisition",
      description: "Conduct legal due diligence for potential acquisition of Zeta Construction. Review all contracts, permits, litigation history, and regulatory compliance.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      department: "LEGAL",
      assignedToId: legalSenior.id,
      createdById: legalManager.id,
      clientId: legalClient3.id,
      deadline: new Date(now + 5 * DAY),
      createdAt: new Date(now - 3 * DAY),
      transitions: [
        { to: "TODO", by: legalManager.id, at: new Date(now - 3 * DAY) },
        { to: "IN_PROGRESS", by: legalSenior.id, at: new Date(now - 2 * DAY) },
      ],
    });

    await createTaskWithHistory({
      id: "legal-task-06",
      title: "Lease Agreement Review - Delta Holdings",
      description: "Review commercial lease agreement for Delta Holdings' new office space in Tirana. Negotiate terms with landlord's legal team.",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      department: "LEGAL",
      assignedToId: legalAssociate.id,
      createdById: legalManager.id,
      clientId: legalClient1.id,
      deadline: new Date(now + 3 * DAY),
      createdAt: new Date(now - 4 * DAY),
      transitions: [
        { to: "TODO", by: legalManager.id, at: new Date(now - 4 * DAY) },
        { to: "IN_PROGRESS", by: legalAssociate.id, at: new Date(now - 3 * DAY) },
      ],
    });

    // ── REVIEW task ──

    await createTaskWithHistory({
      id: "legal-task-07",
      title: "Compliance Audit Report - Eta Retail",
      description: "Prepare regulatory compliance report for Eta Retail covering consumer protection, data privacy (GDPR equivalent), and labor law compliance.",
      priority: "HIGH",
      status: "REVIEW",
      department: "LEGAL",
      assignedToId: null as any,
      createdById: legalManager.id,
      clientId: legalClient4.id,
      deadline: new Date(now + 2 * DAY),
      createdAt: new Date(now - 7 * DAY),
      transitions: [
        { to: "TODO", by: legalManager.id, at: new Date(now - 7 * DAY) },
        { to: "IN_PROGRESS", by: legalJunior.id, at: new Date(now - 6 * DAY) },
        { to: "REVIEW", by: legalJunior.id, at: new Date(now - 1 * DAY) },
      ],
    });

    // ── APPROVED task (waiting for manager to complete) ──

    await createTaskWithHistory({
      id: "legal-task-08",
      title: "Shareholder Agreement - Delta Holdings",
      description: "Draft shareholder agreement for Delta Holdings' new equity partner. Include drag-along, tag-along, and anti-dilution clauses.",
      priority: "URGENT",
      status: "APPROVED",
      department: "LEGAL",
      assignedToId: legalManager.id,
      createdById: legalManager.id,
      clientId: legalClient1.id,
      deadline: new Date(now + 1 * DAY),
      createdAt: new Date(now - 8 * DAY),
      transitions: [
        { to: "TODO", by: legalManager.id, at: new Date(now - 8 * DAY) },
        { to: "IN_PROGRESS", by: legalSenior.id, at: new Date(now - 7 * DAY) },
        { to: "REVIEW", by: legalSenior.id, at: new Date(now - 3 * DAY) },
        { to: "APPROVED", by: legalManager.id, at: new Date(now - 1 * DAY) },
      ],
    });

    // ── TODO tasks ──

    await createTaskWithHistory({
      id: "legal-task-09",
      title: "NDA Drafting - Zeta Construction",
      description: "Draft non-disclosure agreement for Zeta Construction's partnership negotiations with an international contractor.",
      priority: "LOW",
      status: "TODO",
      department: "LEGAL",
      assignedToId: legalJunior.id,
      createdById: legalManager.id,
      clientId: legalClient3.id,
      deadline: new Date(now + 10 * DAY),
      createdAt: new Date(now - 1 * DAY),
      transitions: [
        { to: "TODO", by: legalManager.id, at: new Date(now - 1 * DAY) },
      ],
    });

    await createTaskWithHistory({
      id: "legal-task-10",
      title: "Annual License Renewal - Epsilon Pharma",
      description: "Prepare and file annual pharmaceutical license renewal with the National Agency for Medicines. Deadline is strict — late filing means suspension.",
      priority: "URGENT",
      status: "TODO",
      department: "LEGAL",
      assignedToId: legalAssociate.id,
      createdById: legalManager.id,
      clientId: legalClient2.id,
      deadline: new Date(now + 4 * DAY),
      createdAt: new Date(now),
      transitions: [
        { to: "TODO", by: legalManager.id, at: new Date(now) },
      ],
    });

    // ── OVERDUE task (for performance alerts) ──

    await createTaskWithHistory({
      id: "legal-task-11",
      title: "Tax Dispute Response - Eta Retail",
      description: "Draft legal response to tax authority's assessment dispute. Client received penalty notice — need to file appeal within deadline.",
      priority: "URGENT",
      status: "IN_PROGRESS",
      department: "LEGAL",
      assignedToId: legalSenior.id,
      createdById: legalManager.id,
      clientId: legalClient4.id,
      deadline: new Date(now - 2 * DAY),
      createdAt: new Date(now - 10 * DAY),
      transitions: [
        { to: "TODO", by: legalManager.id, at: new Date(now - 10 * DAY) },
        { to: "IN_PROGRESS", by: legalSenior.id, at: new Date(now - 9 * DAY) },
      ],
    });

    console.log("  Created 11 legal tasks across all statuses with full history");

    // ── Legal Emails ──
    await prisma.email.deleteMany({ where: { threadId: { in: ["legal-thread-001", "legal-thread-002", "legal-thread-003"] } } });

    await prisma.email.create({
      data: {
        threadId: "legal-thread-001",
        senderEmail: "artan@deltaholdings.al",
        senderName: "Artan Shkreli",
        recipientDept: "LEGAL",
        subject: "Urgent: Shareholder agreement deadline",
        body: "Dear legal team, we need the shareholder agreement finalized by end of this week. Our new partner is ready to sign and any delay will jeopardize the deal. Please prioritize this.",
        isIncoming: true,
        isReplied: false,
        clientId: legalClient1.id,
      },
    });

    const legalThread2Root = await prisma.email.create({
      data: {
        threadId: "legal-thread-002",
        senderEmail: "violeta@epsilonpharma.al",
        senderName: "Violeta Hoxha",
        recipientDept: "LEGAL",
        subject: "License renewal documents",
        body: "Hi, I'm sending over the documents needed for our annual pharmaceutical license renewal. Please confirm receipt and let us know if anything is missing.",
        isIncoming: true,
        isReplied: true,
        repliedAt: new Date(now - 2 * DAY),
        clientId: legalClient2.id,
      },
    });

    await prisma.email.create({
      data: {
        threadId: "legal-thread-002",
        parentId: legalThread2Root.id,
        senderEmail: "legal.manager@kreston.al",
        senderName: "Mira Topalli",
        recipientDept: "LEGAL",
        subject: "Re: License renewal documents",
        body: "Thank you Violeta. We received the documents. We are missing the updated GMP certificate — could you send that over? We'll start preparing the application in the meantime.",
        isIncoming: false,
        isReplied: false,
        userId: legalManager.id,
        clientId: legalClient2.id,
      },
    });

    await prisma.email.create({
      data: {
        threadId: "legal-thread-003",
        senderEmail: "besnik@zetaconstruction.al",
        senderName: "Besnik Kola",
        recipientDept: "LEGAL",
        subject: "Initial consultation request - construction permits",
        body: "Hello Kreston legal team, we are a construction company looking for legal advisory on building permits and regulatory compliance for a new residential project in Durres. Can we schedule a meeting?",
        isIncoming: true,
        isReplied: false,
        clientId: legalClient3.id,
      },
    });

    console.log("  Created 4 legal emails across 3 threads");
  }

  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
